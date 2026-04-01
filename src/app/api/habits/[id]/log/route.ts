import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { createHabitLogSchema, habitLogQuerySchema } from '@/lib/validations/goals'
import { ZodError } from 'zod'

function extractHabitId(url: string): string {
  const segments = new URL(url).pathname.split('/')
  const habitsIdx = segments.indexOf('habits')
  return segments[habitsIdx + 1]
}

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const habitId = extractHabitId(req.url)
    const body = await req.json()
    const data = createHabitLogSchema.parse(body)

    // Verify habit belongs to user
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId: user.id },
    })

    if (!habit) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Habit not found' },
        },
        { status: 404 }
      )
    }

    const logDate = new Date(data.date)
    logDate.setHours(0, 0, 0, 0)

    const log = await prisma.habitLog.upsert({
      where: {
        habitId_logDate: {
          habitId,
          logDate,
        },
      },
      update: {
        completed: data.completed,
      },
      create: {
        habitId,
        logDate,
        completed: data.completed,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: log.id,
        habitId: log.habitId,
        logDate: log.logDate.toISOString(),
        completed: log.completed,
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

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const habitId = extractHabitId(req.url)
    const { searchParams } = new URL(req.url)
    const queryObj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryObj[key] = value
    })

    const query = habitLogQuerySchema.parse(queryObj)

    // Verify habit belongs to user
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId: user.id },
    })

    if (!habit) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Habit not found' },
        },
        { status: 404 }
      )
    }

    const fromDate = new Date(query.from)
    fromDate.setHours(0, 0, 0, 0)
    const toDate = new Date(query.to)
    toDate.setHours(23, 59, 59, 999)

    const logs = await prisma.habitLog.findMany({
      where: {
        habitId,
        logDate: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { logDate: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: logs.map((log) => ({
        id: log.id,
        habitId: log.habitId,
        logDate: log.logDate.toISOString(),
        completed: log.completed,
      })),
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
