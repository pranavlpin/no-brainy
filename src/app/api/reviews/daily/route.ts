import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { createReviewSchema, reviewQuerySchema } from '@/lib/validations/reviews'
import { ZodError } from 'zod'
import type { DailyReviewResponse } from '@/lib/types/reviews'
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'

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

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const queryObj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryObj[key] = value
    })

    const query = reviewQuerySchema.parse(queryObj)
    const { page, pageSize } = query
    const skip = (page - 1) * pageSize

    const [reviews, total] = await Promise.all([
      prisma.dailyReview.findMany({
        where: { userId: user.id },
        orderBy: { reviewDate: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.dailyReview.count({ where: { userId: user.id } }),
    ])

    const response: ApiResponse<PaginatedResponse<DailyReviewResponse>> = {
      success: true,
      data: {
        items: reviews.map(formatReview),
        total,
        page,
        pageSize,
        hasMore: skip + reviews.length < total,
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
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const data = createReviewSchema.parse(body)

    const reviewDate = new Date(data.reviewDate + 'T00:00:00.000Z')

    // Check if review already exists for this date
    const existing = await prisma.dailyReview.findUnique({
      where: {
        userId_reviewDate: {
          userId: user.id,
          reviewDate,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'A review already exists for this date',
          },
        },
        { status: 409 }
      )
    }

    // Auto-populate stats for the given date
    const dayStart = new Date(data.reviewDate + 'T00:00:00.000Z')
    const dayEnd = new Date(data.reviewDate + 'T23:59:59.999Z')

    const [tasksCompleted, tasksMissed, notesCreated, reviewSessions] =
      await Promise.all([
        // Tasks completed today
        prisma.task.count({
          where: {
            userId: user.id,
            completedAt: { gte: dayStart, lte: dayEnd },
          },
        }),
        // Tasks missed: due today but not completed
        prisma.task.count({
          where: {
            userId: user.id,
            dueDate: reviewDate,
            status: { not: 'completed' },
          },
        }),
        // Notes created today
        prisma.note.count({
          where: {
            userId: user.id,
            createdAt: { gte: dayStart, lte: dayEnd },
          },
        }),
        // Review sessions today - sum cardsReviewed
        prisma.reviewSession.aggregate({
          where: {
            userId: user.id,
            startedAt: { gte: dayStart, lte: dayEnd },
          },
          _sum: { cardsReviewed: true },
        }),
      ])

    const cardsReviewed = reviewSessions._sum.cardsReviewed ?? 0

    const review = await prisma.dailyReview.create({
      data: {
        userId: user.id,
        reviewDate,
        tasksCompleted,
        tasksMissed,
        notesCreated,
        cardsReviewed,
        reflectionMd: data.reflectionMd ?? '',
        mood: data.mood ?? null,
      },
    })

    const response: ApiResponse<DailyReviewResponse> = {
      success: true,
      data: formatReview(review),
    }

    return NextResponse.json(response, { status: 201 })
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
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
})
