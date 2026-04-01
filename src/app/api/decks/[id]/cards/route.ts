import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { createFlashcardSchema, cardQuerySchema } from '@/lib/validations/flashcards'
import { ZodError } from 'zod'
import type { FlashcardResponse } from '@/lib/types/flashcards'
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'
import type { Prisma, Flashcard } from '@prisma/client'

function extractDeckId(url: string): string {
  const parts = new URL(url).pathname.split('/')
  // /api/decks/[id]/cards -> parts = ['', 'api', 'decks', '<id>', 'cards']
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

export const GET = withAuth(async (req: NextRequest, user) => {
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

    const { searchParams } = new URL(req.url)
    const queryObj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryObj[key] = value
    })

    const query = cardQuerySchema.parse(queryObj)
    const { page, pageSize, state, tags, sortBy, sortOrder } = query

    const where: Prisma.FlashcardWhereInput = {
      deckId,
      userId: user.id,
    }

    if (state) {
      where.state = state
    }

    if (tags) {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
      if (tagList.length > 0) {
        where.tags = { hasSome: tagList }
      }
    }

    const skip = (page - 1) * pageSize

    const [cards, total] = await Promise.all([
      prisma.flashcard.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }),
      prisma.flashcard.count({ where }),
    ])

    const response: ApiResponse<PaginatedResponse<FlashcardResponse>> = {
      success: true,
      data: {
        items: cards.map(formatCard),
        total,
        page,
        pageSize,
        hasMore: skip + cards.length < total,
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
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})

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

    const body = await req.json()
    const data = createFlashcardSchema.parse(body)

    const card = await prisma.flashcard.create({
      data: {
        deckId,
        userId: user.id,
        cardType: data.cardType,
        frontMd: data.frontMd,
        backMd: data.backMd,
        tags: data.tags,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        sourceExcerpt: data.sourceExcerpt,
      },
    })

    const response: ApiResponse<FlashcardResponse> = {
      success: true,
      data: formatCard(card),
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
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})
