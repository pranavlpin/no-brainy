import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { weeklyQuerySchema } from '@/lib/validations/reviews'
import { ZodError } from 'zod'
import type { ApiResponse } from '@/lib/types/api'

interface WeeklySummaryResponse {
  week: string
  startDate: string
  endDate: string
  totalTasksCompleted: number
  totalTasksMissed: number
  totalNotesCreated: number
  totalCardsReviewed: number
  completionRate: number
  streak: number
  dailyBreakdown: {
    date: string
    tasksCompleted: number
    tasksMissed: number
    notesCreated: number
    cardsReviewed: number
    mood: string | null
    hasReview: boolean
  }[]
}

/**
 * Get the Monday start date for an ISO week string like "2026-W14".
 */
function getWeekStartDate(weekStr: string): Date {
  const [yearStr, weekNumStr] = weekStr.split('-W')
  const year = parseInt(yearStr, 10)
  const weekNum = parseInt(weekNumStr, 10)

  // Jan 4 is always in ISO week 1
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7 // Convert Sunday=0 to 7
  // Monday of week 1
  const week1Monday = new Date(jan4)
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1))

  // Monday of the target week
  const targetMonday = new Date(week1Monday)
  targetMonday.setUTCDate(week1Monday.getUTCDate() + (weekNum - 1) * 7)

  return targetMonday
}

/**
 * Get the current ISO week string.
 */
function getCurrentISOWeek(): string {
  const now = new Date()
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const queryObj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryObj[key] = value
    })

    const query = weeklyQuerySchema.parse(queryObj)
    const week = query.week ?? getCurrentISOWeek()

    const monday = getWeekStartDate(week)
    const sunday = new Date(monday)
    sunday.setUTCDate(monday.getUTCDate() + 6)

    // Fetch all daily reviews for the week
    const reviews = await prisma.dailyReview.findMany({
      where: {
        userId: user.id,
        reviewDate: {
          gte: monday,
          lte: sunday,
        },
      },
      orderBy: { reviewDate: 'asc' },
    })

    // Build daily breakdown for all 7 days
    const dailyBreakdown: WeeklySummaryResponse['dailyBreakdown'] = []
    let totalTasksCompleted = 0
    let totalTasksMissed = 0
    let totalNotesCreated = 0
    let totalCardsReviewed = 0

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setUTCDate(monday.getUTCDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      const review = reviews.find(
        (r) => r.reviewDate.toISOString().split('T')[0] === dateStr
      )

      if (review) {
        totalTasksCompleted += review.tasksCompleted
        totalTasksMissed += review.tasksMissed
        totalNotesCreated += review.notesCreated
        totalCardsReviewed += review.cardsReviewed
      }

      dailyBreakdown.push({
        date: dateStr,
        tasksCompleted: review?.tasksCompleted ?? 0,
        tasksMissed: review?.tasksMissed ?? 0,
        notesCreated: review?.notesCreated ?? 0,
        cardsReviewed: review?.cardsReviewed ?? 0,
        mood: review?.mood ?? null,
        hasReview: !!review,
      })
    }

    // Completion rate
    const totalDue = totalTasksCompleted + totalTasksMissed
    const completionRate = totalDue > 0 ? Math.round((totalTasksCompleted / totalDue) * 100) : 0

    // Streak: consecutive days with a review ending at the most recent reviewed day
    let streak = 0
    const reviewDates = reviews
      .map((r) => r.reviewDate.toISOString().split('T')[0])
      .sort()
      .reverse()

    if (reviewDates.length > 0) {
      streak = 1
      for (let i = 1; i < reviewDates.length; i++) {
        const prev = new Date(reviewDates[i - 1] + 'T00:00:00Z')
        const curr = new Date(reviewDates[i] + 'T00:00:00Z')
        const diffDays = (prev.getTime() - curr.getTime()) / 86400000
        if (diffDays === 1) {
          streak++
        } else {
          break
        }
      }
    }

    const response: ApiResponse<WeeklySummaryResponse> = {
      success: true,
      data: {
        week,
        startDate: monday.toISOString().split('T')[0],
        endDate: sunday.toISOString().split('T')[0],
        totalTasksCompleted,
        totalTasksMissed,
        totalNotesCreated,
        totalCardsReviewed,
        completionRate,
        streak,
        dailyBreakdown,
      },
    }

    return NextResponse.json(response)
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
