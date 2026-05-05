import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { createGoalSchema, goalQuerySchema } from '@/lib/validations/goals'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'

async function computeFinancialProgress(
  goal: {
    id: string
    userId: string
    category: string | null
    targetAmount: Prisma.Decimal | null
    startDate: Date | null
    targetDate: Date | null
    expenseCategoryId: string | null
    expenseTag: string | null
  }
): Promise<{ currentAmount: number | null; financialProgress: number | null }> {
  if (goal.category !== 'financial' || !goal.targetAmount) {
    return { currentAmount: null, financialProgress: null }
  }

  const where: Prisma.ExpenseWhereInput = { userId: goal.userId }
  const conditions: Prisma.ExpenseWhereInput[] = []

  if (goal.expenseCategoryId) {
    conditions.push({ categoryId: goal.expenseCategoryId })
  }
  if (goal.expenseTag) {
    conditions.push({ tags: { has: goal.expenseTag } })
  }

  if (conditions.length > 0) {
    where.OR = conditions
  } else {
    // No filter specified, no expenses match
    return { currentAmount: 0, financialProgress: 0 }
  }

  if (goal.startDate || goal.targetDate) {
    where.date = {}
    if (goal.startDate) where.date.gte = goal.startDate
    if (goal.targetDate) where.date.lte = goal.targetDate
  }

  const result = await prisma.expense.aggregate({
    where,
    _sum: { amount: true },
  })

  const currentAmount = result._sum.amount ? Number(result._sum.amount) : 0
  const target = Number(goal.targetAmount)
  const financialProgress = target > 0 ? Math.round((currentAmount / target) * 100) : 0

  return { currentAmount, financialProgress }
}

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const queryObj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryObj[key] = value
    })

    const query = goalQuerySchema.parse(queryObj)
    const { page, pageSize, sortBy, sortOrder } = query

    const where: Prisma.GoalWhereInput = { userId: user.id }

    if (query.status) where.status = query.status
    if (query.category) where.category = query.category

    const [goals, total] = await Promise.all([
      prisma.goal.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { tasks: true } },
          tasks: { select: { status: true } },
          expenseCategory: { select: { name: true } },
        },
      }),
      prisma.goal.count({ where }),
    ])

    const items = await Promise.all(
      goals.map(async (goal) => {
        const completedTaskCount = goal.tasks.filter(
          (t) => t.status === 'completed'
        ).length

        const { currentAmount, financialProgress } = await computeFinancialProgress(goal)

        return {
          id: goal.id,
          userId: goal.userId,
          title: goal.title,
          description: goal.description,
          category: goal.category,
          targetDate: goal.targetDate?.toISOString() ?? null,
          startDate: goal.startDate?.toISOString() ?? null,
          expenseCategoryId: goal.expenseCategoryId ?? null,
          expenseCategoryName: goal.expenseCategory?.name ?? null,
          expenseTag: goal.expenseTag ?? null,
          targetAmount: goal.targetAmount ? Number(goal.targetAmount) : null,
          currentAmount,
          financialProgress,
          status: goal.status,
          createdAt: goal.createdAt.toISOString(),
          updatedAt: goal.updatedAt.toISOString(),
          taskCount: goal._count.tasks,
          completedTaskCount,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      const details: Record<string, string[]> = {}
      for (const issue of error.issues) {
        const field = issue.path.join('.')
        if (!details[field]) details[field] = []
        details[field].push(issue.message)
      }
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const data = createGoalSchema.parse(body)

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: data.title,
        description: data.description,
        category: data.category ?? null,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        expenseCategoryId: data.expenseCategoryId ?? null,
        expenseTag: data.expenseTag ?? null,
        targetAmount: data.targetAmount ?? null,
        status: data.status,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: goal.id,
          userId: goal.userId,
          title: goal.title,
          description: goal.description,
          category: goal.category,
          targetDate: goal.targetDate?.toISOString() ?? null,
          startDate: goal.startDate?.toISOString() ?? null,
          expenseCategoryId: goal.expenseCategoryId ?? null,
          expenseTag: goal.expenseTag ?? null,
          targetAmount: goal.targetAmount ? Number(goal.targetAmount) : null,
          status: goal.status,
          createdAt: goal.createdAt.toISOString(),
          updatedAt: goal.updatedAt.toISOString(),
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
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})
