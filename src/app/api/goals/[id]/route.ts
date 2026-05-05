import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { updateGoalSchema } from '@/lib/validations/goals'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'

function extractId(url: string): string {
  const segments = new URL(url).pathname.split('/')
  // /api/goals/[id] => segments = ['', 'api', 'goals', '<id>']
  return segments[segments.length - 1]
}

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
    const id = extractId(req.url)

    const goal = await prisma.goal.findFirst({
      where: { id, userId: user.id },
      include: {
        tasks: { select: { id: true, status: true } },
        expenseCategory: { select: { name: true } },
      },
    })

    if (!goal) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Goal not found' },
        },
        { status: 404 }
      )
    }

    const taskCount = goal.tasks.length
    const completedTaskCount = goal.tasks.filter(
      (t) => t.status === 'completed'
    ).length

    const { currentAmount, financialProgress } = await computeFinancialProgress(goal)

    return NextResponse.json({
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
        expenseCategoryName: goal.expenseCategory?.name ?? null,
        expenseTag: goal.expenseTag ?? null,
        targetAmount: goal.targetAmount ? Number(goal.targetAmount) : null,
        currentAmount,
        financialProgress,
        status: goal.status,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
        taskCount,
        completedTaskCount,
      },
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})

export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const id = extractId(req.url)
    const body = await req.json()
    const data = updateGoalSchema.parse(body)

    const existing = await prisma.goal.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Goal not found' },
        },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.category !== undefined) updateData.category = data.category
    if (data.status !== undefined) updateData.status = data.status
    if (data.targetDate !== undefined) {
      updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null
    }
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null
    }
    if (data.expenseCategoryId !== undefined) {
      updateData.expenseCategoryId = data.expenseCategoryId ?? null
    }
    if (data.expenseTag !== undefined) {
      updateData.expenseTag = data.expenseTag ?? null
    }
    if (data.targetAmount !== undefined) {
      updateData.targetAmount = data.targetAmount ?? null
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
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

export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const id = extractId(req.url)

    const existing = await prisma.goal.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Goal not found' },
        },
        { status: 404 }
      )
    }

    await prisma.goal.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      data: { id },
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})
