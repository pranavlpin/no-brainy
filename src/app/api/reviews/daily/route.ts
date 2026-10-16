import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { createReviewSchema, reviewQuerySchema } from '@/lib/validations/reviews'
import {
  ReviewError,
  reviewFailure,
  serializeDaily,
  saveDaily,
  reviewActivity,
} from '@/lib/reviews/server'
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { page, pageSize } = reviewQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    const [reviews, total] = await Promise.all([
      prisma.dailyReview.findMany({
        where: { userId: user.id },
        orderBy: [{ reviewDate: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.dailyReview.count({ where: { userId: user.id } }),
    ])
    const items = await Promise.all(
      reviews.map(async (review) => {
        const result = serializeDaily(review)
        const activity = await reviewActivity(user, result.reviewDate)
        return {
          ...result,
          tasksCompleted: activity.tasksCompleted,
          tasksMissed: activity.tasksMissed,
          notesCreated: activity.notesCreated,
          cardsReviewed: activity.cardsReviewed,
        }
      })
    )
    return NextResponse.json({
      success: true,
      data: { items, total, page, pageSize, hasMore: page * pageSize < total },
    })
  } catch (error) {
    return reviewFailure(error)
  }
})
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const { reviewDate, ...input } = createReviewSchema.parse(await req.json())
    if (
      await prisma.dailyReview.findUnique({
        where: { userId_reviewDate: { userId: user.id, reviewDate: new Date(reviewDate) } },
      })
    )
      throw new ReviewError(409, 'A review already exists for this date')
    return NextResponse.json(
      { success: true, data: await saveDaily(user, reviewDate, input) },
      { status: 201 }
    )
  } catch (error) {
    return reviewFailure(error)
  }
})
