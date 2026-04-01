import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth/middleware'
import { updateReviewSchema } from '@/lib/validations/reviews'
import { ZodError } from 'zod'
import type { DailyReviewResponse } from '@/lib/types/reviews'
import type { ApiResponse } from '@/lib/types/api'

function formatReview(review: {
  id: string
  userId: string
  reviewDate: Date
  tasksCompleted: number
  tasksMissed: number
  notesCreated: number
  cardsReviewed: number
  reflectionMd: string
  aiSummaryMd: string | null
  mood: string | null
  createdAt: Date
}): DailyReviewResponse {
  return {
    id: review.id,
    userId: review.userId,
    reviewDate: review.reviewDate.toISOString().split('T')[0],
    tasksCompleted: review.tasksCompleted,
    tasksMissed: review.tasksMissed,
    notesCreated: review.notesCreated,
    cardsReviewed: review.cardsReviewed,
    reflectionMd: review.reflectionMd,
    aiSummaryMd: review.aiSummaryMd,
    mood: review.mood,
    createdAt: review.createdAt.toISOString(),
  }
}

function extractDate(url: string): string {
  const segments = new URL(url).pathname.split('/')
  // /api/reviews/daily/[date]
  return segments[segments.length - 1]
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    },
    { status: 401 }
  )
}

function notFoundResponse() {
  return NextResponse.json(
    {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Review not found for this date' },
    },
    { status: 404 }
  )
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const dateStr = extractDate(req.url)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid date format. Use YYYY-MM-DD' },
        },
        { status: 400 }
      )
    }

    const reviewDate = new Date(dateStr + 'T00:00:00.000Z')

    const review = await prisma.dailyReview.findUnique({
      where: {
        userId_reviewDate: {
          userId: user.id,
          reviewDate,
        },
      },
    })

    if (!review) return notFoundResponse()

    const response: ApiResponse<DailyReviewResponse> = {
      success: true,
      data: formatReview(review),
    }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const dateStr = extractDate(req.url)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid date format. Use YYYY-MM-DD' },
        },
        { status: 400 }
      )
    }

    const reviewDate = new Date(dateStr + 'T00:00:00.000Z')

    const existing = await prisma.dailyReview.findUnique({
      where: {
        userId_reviewDate: {
          userId: user.id,
          reviewDate,
        },
      },
    })

    if (!existing) return notFoundResponse()

    const body = await req.json()
    const data = updateReviewSchema.parse(body)

    const review = await prisma.dailyReview.update({
      where: { id: existing.id },
      data,
    })

    const response: ApiResponse<DailyReviewResponse> = {
      success: true,
      data: formatReview(review),
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
}
