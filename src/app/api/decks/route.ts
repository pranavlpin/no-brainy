import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { createDeckSchema, deckQuerySchema } from '@/lib/validations/flashcards'
import { ZodError } from 'zod'
import type { DeckResponse } from '@/lib/types/flashcards'
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'
import type { Prisma } from '@prisma/client'

type DeckWithCount = Prisma.DeckGetPayload<{
  include: { _count: { select: { flashcards: true } } }
}>

function formatDeck(deck: DeckWithCount): DeckResponse {
  return {
    id: deck.id,
    userId: deck.userId,
    name: deck.name,
    descriptionMd: deck.descriptionMd,
    tags: deck.tags,
    createdAt: deck.createdAt.toISOString(),
    updatedAt: deck.updatedAt.toISOString(),
    flashcardCount: deck._count.flashcards,
  }
}

function zodErrorDetails(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const field = issue.path.join('.')
    if (!details[field]) details[field] = []
    details[field].push(issue.message)
  }
  return details
}

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const queryObj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryObj[key] = value
    })

    const query = deckQuerySchema.parse(queryObj)
    const { page, pageSize, search, tags, sortBy, sortOrder } = query

    const where: Prisma.DeckWhereInput = {
      userId: user.id,
    }

    if (tags) {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
      if (tagList.length > 0) {
        where.tags = { hasSome: tagList }
      }
    }

    if (search && search.trim().length > 0) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { descriptionMd: { contains: search, mode: 'insensitive' } },
      ]
    }

    const skip = (page - 1) * pageSize

    const [decks, total] = await Promise.all([
      prisma.deck.findMany({
        where,
        include: { _count: { select: { flashcards: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }),
      prisma.deck.count({ where }),
    ])

    const response: ApiResponse<PaginatedResponse<DeckResponse>> = {
      success: true,
      data: {
        items: decks.map(formatDeck),
        total,
        page,
        pageSize,
        hasMore: skip + decks.length < total,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: zodErrorDetails(error),
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
    const body = await req.json()
    const data = createDeckSchema.parse(body)

    const deck = await prisma.deck.create({
      data: {
        userId: user.id,
        name: data.name,
        descriptionMd: data.descriptionMd,
        tags: data.tags,
      },
      include: { _count: { select: { flashcards: true } } },
    })

    const response: ApiResponse<DeckResponse> = {
      success: true,
      data: formatDeck(deck),
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: zodErrorDetails(error),
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
