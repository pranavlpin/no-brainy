import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { updateFlashcardSchema } from '@/lib/validations/flashcards'
import { ZodError } from 'zod'
import type { FlashcardResponse } from '@/lib/types/flashcards'
import type { ApiResponse } from '@/lib/types/api'
import type { Flashcard } from '@prisma/client'

function extractId(url: string): string {
  const parts = new URL(url).pathname.split('/')
  // /api/flashcards/[id] -> parts = ['', 'api', 'flashcards', '<id>']
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
    const id = extractId(req.url)

    const card = await prisma.flashcard.findFirst({
      where: { id, userId: user.id },
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

    const response: ApiResponse<FlashcardResponse> = {
      success: true,
      data: formatCard(card),
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
})

export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const id = extractId(req.url)
    const body = await req.json()
    const data = updateFlashcardSchema.parse(body)

    const existing = await prisma.flashcard.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Flashcard not found' },
        },
        { status: 404 }
      )
    }

    // If deckId is being changed, verify new deck belongs to user
    if (data.deckId) {
      const deck = await prisma.deck.findFirst({
        where: { id: data.deckId, userId: user.id },
      })
      if (!deck) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Target deck not found' },
          },
          { status: 404 }
        )
      }
    }

    const card = await prisma.flashcard.update({
      where: { id },
      data,
    })

    const response: ApiResponse<FlashcardResponse> = {
      success: true,
      data: formatCard(card),
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

export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const id = extractId(req.url)

    const existing = await prisma.flashcard.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Flashcard not found' },
        },
        { status: 404 }
      )
    }

    await prisma.flashcard.delete({ where: { id } })

    return NextResponse.json({ success: true, data: null })
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
