import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { createWatchlistSchema, watchlistQuerySchema } from '@/lib/validations/watchlist'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const url = new URL(req.url)
    const params = Object.fromEntries(url.searchParams.entries())
    const query = watchlistQuerySchema.parse(params)

    const where: Prisma.WatchlistItemWhereInput = { userId: user.id }

    if (query.type) {
      where.type = query.type
    }

    if (query.status) {
      where.status = query.status
    }

    if (query.genre) {
      where.genre = { has: query.genre }
    }

    if (query.tags) {
      where.tags = { has: query.tags }
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { platform: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      prisma.watchlistItem.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.watchlistItem.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: items.map(serializeItem),
        total,
        page: query.page,
        pageSize: query.pageSize,
        hasMore: query.page * query.pageSize < total,
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error)
    }
    console.error('GET /api/watchlist error:', error)
    return internalError()
  }
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const data = createWatchlistSchema.parse(body)

    const item = await prisma.watchlistItem.create({
      data: {
        userId: user.id,
        title: data.title,
        type: data.type,
        genre: data.genre,
        tags: data.tags,
        status: data.status,
        rating: data.rating ?? null,
        notesMd: data.notesMd,
        coverUrl: data.coverUrl || null,
        year: data.year ?? null,
        platform: data.platform || null,
        completedAt: data.status === 'completed' ? new Date() : null,
      },
    })

    return NextResponse.json(
      { success: true, data: serializeItem(item) },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error)
    }
    console.error('POST /api/watchlist error:', error)
    return internalError()
  }
})

function serializeItem(item: {
  id: string
  userId: string
  title: string
  type: string
  genre: string[]
  tags: string[]
  status: string
  rating: number | null
  notesMd: string
  coverUrl: string | null
  year: number | null
  platform: string | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): Record<string, unknown> {
  return {
    id: item.id,
    userId: item.userId,
    title: item.title,
    type: item.type,
    genre: item.genre,
    tags: item.tags,
    status: item.status,
    rating: item.rating,
    notesMd: item.notesMd,
    coverUrl: item.coverUrl,
    year: item.year,
    platform: item.platform,
    completedAt: item.completedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

function validationError(error: ZodError): NextResponse {
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

function internalError(): NextResponse {
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
