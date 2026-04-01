import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import type { FlashcardResponse, ReviewSessionResponse } from '@/lib/types/flashcards'
import type { ApiResponse } from '@/lib/types/api'
import type { Flashcard } from '@prisma/client'

function extractDeckId(url: string): string {
  const parts = new URL(url).pathname.split('/')
  // /api/decks/[id]/review -> parts = ['', 'api', 'decks', '<id>', 'review']
  return parts[3]
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
    const deckId = extractDeckId(req.url)

    // Verify deck belongs to user
    const deck = await prisma.deck.findFirst({
      where: { id: deckId, userId: user.id },
    })

    if (!deck) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Deck not found' },
        },
        { status: 404 }
      )
    }

    // Create review session
    const session = await prisma.reviewSession.create({
      data: {
        userId: user.id,
        deckId,
      },
    })

    // Get due cards: nextReviewAt <= today, state != 'mastered', limit 20
    // Ordered by: forgot first (state = 'learning' from forgot), then by nextReviewAt ascending
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const cards = await prisma.flashcard.findMany({
      where: {
        deckId,
        userId: user.id,
        nextReviewAt: { lte: today },
        state: { not: 'mastered' },
      },
      orderBy: [
        { nextReviewAt: 'asc' },
      ],
      take: 20,
    })

    // Sort: forgot cards (lastRating = 'forgot') first, then by nextReviewAt
    const forgotCards = cards.filter(c => c.lastRating === 'forgot')
    const otherCards = cards.filter(c => c.lastRating !== 'forgot')
    const sortedCards = [...forgotCards, ...otherCards]

    const sessionResponse: ReviewSessionResponse = {
      id: session.id,
      userId: session.userId,
      deckId: session.deckId,
      startedAt: session.startedAt.toISOString(),
      completedAt: null,
      cardsReviewed: session.cardsReviewed,
      cardsEasy: session.cardsEasy,
      cardsMedium: session.cardsMedium,
      cardsHard: session.cardsHard,
      cardsForgot: session.cardsForgot,
    }

    const response: ApiResponse<{
      session: ReviewSessionResponse
      cards: FlashcardResponse[]
    }> = {
      success: true,
      data: {
        session: sessionResponse,
        cards: sortedCards.map(formatCard),
      },
    }

    return NextResponse.json(response, { status: 201 })
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
