import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { rateCardSchema } from '@/lib/validations/flashcards'
import { nextReview } from '@/lib/flashcards/sm2'
import { ZodError } from 'zod'
import type { FlashcardResponse } from '@/lib/types/flashcards'
import type { ApiResponse } from '@/lib/types/api'
import type { Flashcard } from '@prisma/client'

function extractCardId(url: string): string {
  const parts = new URL(url).pathname.split('/')
  // /api/flashcards/[id]/rate -> parts = ['', 'api', 'flashcards', '<id>', 'rate']
  return parts[3]
}

const ratingMap: Record<string, number> = {
  forgot: 0,
  hard: 1,
  medium: 2,
  easy: 3,
}

const sessionCountField: Record<string, string> = {
  forgot: 'cardsForgot',
  hard: 'cardsHard',
  medium: 'cardsMedium',
  easy: 'cardsEasy',
}

function formatCard(card: Flashcard): FlashcardResponse {
  return {
    id: card.id,
    deckId: card.deckId,
    userId: card.userId,
    cardType: card.cardType as FlashcardResponse['cardType'],
    frontMd: card.frontMd,
    backMd: card.backMd,
    tags: card.tags,
    sourceType: card.sourceType,
    sourceId: card.sourceId,
    sourceExcerpt: card.sourceExcerpt,
    state: card.state as FlashcardResponse['state'],
    easeFactor: card.easeFactor,
    interval: card.interval,
    nextReviewAt: card.nextReviewAt.toISOString(),
    reviewCount: card.reviewCount,
    lastRating: card.lastRating as FlashcardResponse['lastRating'],
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
  }
}

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const cardId = extractCardId(req.url)
    const body = await req.json()
    const data = rateCardSchema.parse(body)

    // Verify card belongs to user
    const card = await prisma.flashcard.findFirst({
      where: { id: cardId, userId: user.id },
    })

    if (!card) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Flashcard not found' },
        },
        { status: 404 }
      )
    }

    // Verify session belongs to user
    const session = await prisma.reviewSession.findFirst({
      where: { id: data.sessionId, userId: user.id },
    })

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Review session not found' },
        },
        { status: 404 }
      )
    }

    // Calculate SM-2 result
    const numericRating = ratingMap[data.rating]
    const result = nextReview(card.interval, card.easeFactor, numericRating)

    // Calculate nextReviewAt: today + interval days
    const nextReviewDate = new Date()
    nextReviewDate.setHours(0, 0, 0, 0)
    nextReviewDate.setDate(nextReviewDate.getDate() + result.interval)

    // Update card
    const updatedCard = await prisma.flashcard.update({
      where: { id: cardId },
      data: {
        interval: result.interval,
        easeFactor: result.easeFactor,
        state: result.state,
        nextReviewAt: nextReviewDate,
        reviewCount: { increment: 1 },
        lastRating: data.rating,
      },
    })

    // Update session counts
    const countField = sessionCountField[data.rating]
    await prisma.reviewSession.update({
      where: { id: data.sessionId },
      data: {
        cardsReviewed: { increment: 1 },
        [countField]: { increment: 1 },
      },
    })

    const response: ApiResponse<FlashcardResponse> = {
      success: true,
      data: formatCard(updatedCard),
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
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})
