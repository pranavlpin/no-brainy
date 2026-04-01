import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'

function extractHabitId(url: string): string {
  const segments = new URL(url).pathname.split('/')
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
    const habitId = extractHabitId(req.url)

    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId: user.id },
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

    const totalCompletions = habit.logs.filter((l) => l.completed).length

    return NextResponse.json({
      success: true,
      data: {
        habitId: habit.id,
        currentStreak: calculateCurrentStreak(habit.logs),
        longestStreak: calculateLongestStreak(habit.logs),
        totalCompletions,
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
