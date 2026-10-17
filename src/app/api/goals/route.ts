import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { userTimezone } from '@/lib/dates'
import { createGoalSchema, goalQuerySchema } from '@/lib/validations/goals'
import {
  goalInclude,
  goalWriteData,
  practiceCountsForGoals,
  serializeGoal,
} from '@/lib/goals/serialize'

function validationError(error: ZodError, message: string) {
  const details: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const field = issue.path.join('.')
    if (!details[field]) details[field] = []
    details[field].push(issue.message)
  }
  return NextResponse.json(
    { success: false, error: { code: 'VALIDATION_ERROR', message, details } },
    { status: 400 }
  )
}

const internalError = () =>
  NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    { status: 500 }
  )

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const queryObj: Record<string, string> = {}
    new URL(req.url).searchParams.forEach((value, key) => {
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
        include: goalInclude,
      }),
      prisma.goal.count({ where }),
    ])
    const practice = await practiceCountsForGoals(
      user.id,
      goals.map((g) => g.id),
      userTimezone(user)
    )
    const items = await Promise.all(goals.map((g) => serializeGoal(g, practice.get(g.id) ?? 0)))

    return NextResponse.json({
      success: true,
      data: { items, total, page, pageSize, hasMore: page * pageSize < total },
    })
  } catch (error) {
    if (error instanceof ZodError) return validationError(error, 'Invalid query parameters')
    console.error('[goals GET]', error)
    return internalError()
  }
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const data = createGoalSchema.parse(await req.json())
    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        ...goalWriteData(data),
        category: data.category ?? null,
        expenseCategoryId: data.expenseCategoryId ?? null,
        expenseTag: data.expenseTag ?? null,
        targetAmount: data.targetAmount ?? null,
        baseline: data.baseline ?? null,
        target: data.target ?? null,
        unit: data.unit ?? null,
        weeklyPracticeTarget: data.weeklyPracticeTarget ?? null,
      },
      include: goalInclude,
    })
    return NextResponse.json({ success: true, data: await serializeGoal(goal, 0) }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) return validationError(error, 'Invalid input')
    console.error('[goals POST]', error)
    return internalError()
  }
})
