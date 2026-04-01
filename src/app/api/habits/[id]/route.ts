import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { updateHabitSchema } from '@/lib/validations/goals'
import { ZodError } from 'zod'

function extractId(url: string): string {
  const segments = new URL(url).pathname.split('/')
  // /api/habits/[id] => ['', 'api', 'habits', '<id>']
  // /api/habits/[id]/log => ['', 'api', 'habits', '<id>', 'log']
  const habitsIdx = segments.indexOf('habits')
  return segments[habitsIdx + 1]
}

function calculateCurrentStreak(
  logs: { logDate: Date; completed: boolean }[]
): number {
  const completed = logs
    .filter((l) => l.completed)
    .sort((a, b) => b.logDate.getTime() - a.logDate.getTime())

  if (completed.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const firstDate = new Date(completed[0].logDate)
  firstDate.setHours(0, 0, 0, 0)

  if (
    firstDate.getTime() !== today.getTime() &&
    firstDate.getTime() !== yesterday.getTime()
  ) {
    return 0
  }

  let streak = 1
  for (let i = 1; i < completed.length; i++) {
    const prev = new Date(completed[i - 1].logDate)
    prev.setHours(0, 0, 0, 0)
    const curr = new Date(completed[i].logDate)
    curr.setHours(0, 0, 0, 0)
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
    if (diff === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}

function calculateLongestStreak(
  logs: { logDate: Date; completed: boolean }[]
): number {
  const completed = logs
    .filter((l) => l.completed)
    .sort((a, b) => a.logDate.getTime() - b.logDate.getTime())

  if (completed.length === 0) return 0

  let longest = 1
  let current = 1

  for (let i = 1; i < completed.length; i++) {
    const prev = new Date(completed[i - 1].logDate)
    prev.setHours(0, 0, 0, 0)
    const curr = new Date(completed[i].logDate)
    curr.setHours(0, 0, 0, 0)
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    if (diff === 1) {
      current++
      if (current > longest) longest = current
    } else {
      current = 1
    }
  }

  return longest
}

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const id = extractId(req.url)

    const habit = await prisma.habit.findFirst({
      where: { id, userId: user.id },
      include: {
        logs: {
          orderBy: { logDate: 'desc' },
        },
      },
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

    const recentLogs = habit.logs.slice(0, 30).map((l) => ({
      id: l.id,
      habitId: l.habitId,
      logDate: l.logDate.toISOString(),
      completed: l.completed,
    }))

    return NextResponse.json({
      success: true,
      data: {
        id: habit.id,
        userId: habit.userId,
        goalId: habit.goalId,
        title: habit.title,
        frequency: habit.frequency,
        createdAt: habit.createdAt.toISOString(),
        currentStreak: calculateCurrentStreak(habit.logs),
        longestStreak: calculateLongestStreak(habit.logs),
        totalCompletions: habit.logs.filter((l) => l.completed).length,
        recentLogs,
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

export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const id = extractId(req.url)
    const body = await req.json()
    const data = updateHabitSchema.parse(body)

    const existing = await prisma.habit.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Habit not found' },
        },
        { status: 404 }
      )
    }

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

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.frequency !== undefined) updateData.frequency = data.frequency
    if (data.goalId !== undefined) updateData.goalId = data.goalId

    const habit = await prisma.habit.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: habit.id,
        userId: habit.userId,
        goalId: habit.goalId,
        title: habit.title,
        frequency: habit.frequency,
        createdAt: habit.createdAt.toISOString(),
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

    const existing = await prisma.habit.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Habit not found' },
        },
        { status: 404 }
      )
    }

    // Cascade deletes logs due to onDelete: Cascade in schema
    await prisma.habit.delete({ where: { id } })

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
