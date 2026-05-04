import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { createBudgetSchema, budgetQuerySchema } from '@/lib/validations/budgets'
import { ZodError } from 'zod'
import type { BudgetHealth, BudgetPeriod, BudgetResponse } from '@/lib/types/budgets'

function getPeriodDateRange(period: BudgetPeriod, startDate: Date | null, endDate: Date | null): { start: Date; end: Date } {
  const now = new Date()

  switch (period) {
    case 'monthly': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      return { start, end }
    }
    case 'quarterly': {
      const quarter = Math.floor(now.getMonth() / 3)
      const start = new Date(now.getFullYear(), quarter * 3, 1)
      const end = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999)
      return { start, end }
    }
    case 'yearly': {
      const start = new Date(now.getFullYear(), 0, 1)
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
      return { start, end }
    }
    case 'total': {
      const start = startDate ?? new Date(2000, 0, 1)
      const end = endDate ?? new Date(2100, 11, 31, 23, 59, 59, 999)
      return { start, end }
    }
  }
}

function computeDaysLeft(period: BudgetPeriod, endDate: Date | null): number | null {
  const now = new Date()
  let target: Date

  switch (period) {
    case 'monthly':
      target = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      break
    case 'quarterly': {
      const quarter = Math.floor(now.getMonth() / 3)
      target = new Date(now.getFullYear(), quarter * 3 + 3, 0)
      break
    }
    case 'yearly':
      target = new Date(now.getFullYear(), 11, 31)
      break
    case 'total':
      if (!endDate) return null
      target = endDate
      break
  }

  const diffMs = target.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

function computeHealth(type: string, percentage: number): BudgetHealth {
  if (type === 'target') {
    if (percentage >= 100) return 'completed'
    if (percentage >= 75) return 'on-track'
    return 'on-track'
  }
  // limit type
  if (percentage > 100) return 'over-budget'
  if (percentage >= 75) return 'warning'
  return 'on-track'
}

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const queryObj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryObj[key] = value
    })

    const query = budgetQuerySchema.parse(queryObj)

    const where: Record<string, unknown> = { userId: user.id }
    if (query.isActive !== undefined) where.isActive = query.isActive
    else where.isActive = true
    if (query.categoryId) where.categoryId = query.categoryId
    if (query.type) where.type = query.type

    const budgets = await prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    })

    // Compute spent for each budget
    const results: BudgetResponse[] = await Promise.all(
      budgets.map(async (budget) => {
        const { start, end } = getPeriodDateRange(
          budget.period as BudgetPeriod,
          budget.startDate,
          budget.endDate
        )

        const spentResult = await prisma.expense.aggregate({
          where: {
            userId: user.id,
            categoryId: budget.categoryId,
            date: { gte: start, lte: end },
          },
          _sum: { amount: true },
        })

        const spent = Number(spentResult._sum.amount ?? 0)
        const amount = Number(budget.amount)
        const remaining = amount - spent
        const percentage = amount > 0 ? (spent / amount) * 100 : 0
        const health = computeHealth(budget.type, percentage)
        const daysLeft = computeDaysLeft(budget.period as BudgetPeriod, budget.endDate)

        return {
          id: budget.id,
          userId: budget.userId,
          name: budget.name,
          type: budget.type as BudgetResponse['type'],
          categoryId: budget.categoryId,
          categoryName: budget.category.name,
          categoryIcon: budget.category.icon,
          categoryColor: budget.category.color,
          amount,
          period: budget.period as BudgetPeriod,
          startDate: budget.startDate ? budget.startDate.toISOString().split('T')[0] : null,
          endDate: budget.endDate ? budget.endDate.toISOString().split('T')[0] : null,
          isActive: budget.isActive,
          createdAt: budget.createdAt.toISOString(),
          updatedAt: budget.updatedAt.toISOString(),
          spent,
          remaining,
          percentage: Math.round(percentage * 10) / 10,
          health,
          daysLeft,
        }
      })
    )

    return NextResponse.json({ success: true, data: results })
  } catch (error) {
    if (error instanceof ZodError) {
      const details: Record<string, string[]> = {}
      for (const issue of error.issues) {
        const field = issue.path.join('.')
        if (!details[field]) details[field] = []
        details[field].push(issue.message)
      }
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details } },
        { status: 400 }
      )
    }
    console.error('Budgets GET error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const data = createBudgetSchema.parse(body)

    // Validate category belongs to user
    const category = await prisma.expenseCategory.findFirst({
      where: { id: data.categoryId, userId: user.id },
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 }
      )
    }

    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        name: data.name,
        type: data.type,
        categoryId: data.categoryId,
        amount: data.amount,
        period: data.period,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
      include: { category: true },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: budget.id,
          userId: budget.userId,
          name: budget.name,
          type: budget.type,
          categoryId: budget.categoryId,
          categoryName: budget.category.name,
          categoryIcon: budget.category.icon,
          categoryColor: budget.category.color,
          amount: Number(budget.amount),
          period: budget.period,
          startDate: budget.startDate ? budget.startDate.toISOString().split('T')[0] : null,
          endDate: budget.endDate ? budget.endDate.toISOString().split('T')[0] : null,
          isActive: budget.isActive,
          createdAt: budget.createdAt.toISOString(),
          updatedAt: budget.updatedAt.toISOString(),
          spent: 0,
          remaining: Number(budget.amount),
          percentage: 0,
          health: 'on-track',
          daysLeft: computeDaysLeft(budget.period as BudgetPeriod, budget.endDate),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      const details: Record<string, string[]> = {}
      for (const issue of error.issues) {
        const field = issue.path.join('.')
        if (!details[field]) details[field] = []
        details[field].push(issue.message)
      }
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details } },
        { status: 400 }
      )
    }
    console.error('Budgets POST error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})
