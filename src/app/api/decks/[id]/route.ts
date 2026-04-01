import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { updateDeckSchema } from '@/lib/validations/flashcards'
import { ZodError } from 'zod'
import type { DeckResponse } from '@/lib/types/flashcards'
import type { ApiResponse } from '@/lib/types/api'

function extractId(url: string): string {
  const parts = new URL(url).pathname.split('/')
  // /api/decks/[id] -> parts = ['', 'api', 'decks', '<id>']
  return parts[3]
}

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const id = extractId(req.url)

    const deck = await prisma.deck.findFirst({
      where: { id, userId: user.id },
      include: {
        _count: { select: { flashcards: true } },
        flashcards: {
          select: { state: true, nextReviewAt: true },
        },
      },
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

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const dueCount = deck.flashcards.filter(
      c => c.state !== 'mastered' && c.nextReviewAt <= now
    ).length
    const newCount = deck.flashcards.filter(c => c.state === 'new').length

    const response: ApiResponse<DeckResponse> = {
      success: true,
      data: {
        id: deck.id,
        userId: deck.userId,
        name: deck.name,
        descriptionMd: deck.descriptionMd,
        tags: deck.tags,
        createdAt: deck.createdAt.toISOString(),
        updatedAt: deck.updatedAt.toISOString(),
        flashcardCount: deck._count.flashcards,
        dueCount,
        newCount,
      },
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
    const data = updateDeckSchema.parse(body)

    const existing = await prisma.deck.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Deck not found' },
        },
        { status: 404 }
      )
    }

    const deck = await prisma.deck.update({
      where: { id },
      data,
      include: { _count: { select: { flashcards: true } } },
    })

    const response: ApiResponse<DeckResponse> = {
      success: true,
      data: {
        id: deck.id,
        userId: deck.userId,
        name: deck.name,
        descriptionMd: deck.descriptionMd,
        tags: deck.tags,
        createdAt: deck.createdAt.toISOString(),
        updatedAt: deck.updatedAt.toISOString(),
        flashcardCount: deck._count.flashcards,
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

    const existing = await prisma.deck.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Deck not found' },
        },
        { status: 404 }
      )
    }

    await prisma.deck.delete({ where: { id } })

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
