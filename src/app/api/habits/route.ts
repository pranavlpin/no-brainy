import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { createHabitSchema, habitQuerySchema } from '@/lib/validations/goals'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'

function calculateCurrentStreak(
  logs: { logDate: Date; completed: boolean }[]
): number {
  if (logs.length === 0) return 0

  // Sort descending by date
  const sorted = [...logs]
    .filter((l) => l.completed)
    .sort((a, b) => b.logDate.getTime() - a.logDate.getTime())

  if (sorted.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const firstLogDate = new Date(sorted[0].logDate)
  firstLogDate.setHours(0, 0, 0, 0)

  // Streak must start from today or yesterday
  if (
    firstLogDate.getTime() !== today.getTime() &&
    firstLogDate.getTime() !== yesterday.getTime()
  ) {
    return 0
  }

  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1].logDate)
    prevDate.setHours(0, 0, 0, 0)
    const currDate = new Date(sorted[i].logDate)
    currDate.setHours(0, 0, 0, 0)

    const diffDays =
      (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const queryObj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryObj[key] = value
    })

    const query = habitQuerySchema.parse(queryObj)
    const { page, pageSize, sortBy, sortOrder } = query

    const where: Prisma.HabitWhereInput = { userId: user.id }
    if (query.goalId) where.goalId = query.goalId

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [habits, total] = await Promise.all([
      prisma.habit.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          logs: {
            where: { completed: true },
            orderBy: { logDate: 'desc' },
          },
        },
      }),
      prisma.habit.count({ where }),
    ])

    const items = habits.map((habit) => {
      const todayLog = habit.logs.find((l) => {
        const d = new Date(l.logDate)
        d.setHours(0, 0, 0, 0)
        return d.getTime() === today.getTime()
      })

      return {
        id: habit.id,
        userId: habit.userId,
        goalId: habit.goalId,
        title: habit.title,
        frequency: habit.frequency,
        createdAt: habit.createdAt.toISOString(),
        currentStreak: calculateCurrentStreak(habit.logs),
        completedToday: todayLog?.completed ?? false,
      }
    })

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
    const data = createHabitSchema.parse(body)

    // Verify goal belongs to user if provided
    if (data.goalId) {
      const goal = await prisma.goal.findFirst({
        where: { id: data.goalId, userId: user.id },
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
    }

    const habit = await prisma.habit.create({
      data: {
        userId: user.id,
        title: data.title,
        frequency: data.frequency,
        goalId: data.goalId ?? null,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: habit.id,
          userId: habit.userId,
          goalId: habit.goalId,
          title: habit.title,
          frequency: habit.frequency,
          createdAt: habit.createdAt.toISOString(),
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
