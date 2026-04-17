import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { updateWatchlistSchema } from '@/lib/validations/watchlist'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'
import type { AuthUser } from '@/lib/types/auth'

function extractItemId(req: NextRequest): string {
  const segments = new URL(req.url).pathname.split('/')
  return segments[segments.length - 1]
}

async function getOwnedItem(itemId: string, user: AuthUser) {
  return prisma.watchlistItem.findFirst({
    where: { id: itemId, userId: user.id },
  })
}

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const itemId = extractItemId(req)
    const item = await getOwnedItem(itemId, user)

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Watchlist item not found' },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: serializeItem(item) })
  } catch (error) {
    console.error('GET /api/watchlist/[id] error:', error)
    return internalError()
  }
})

export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const itemId = extractItemId(req)
    const existing = await getOwnedItem(itemId, user)

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Watchlist item not found' },
        },
        { status: 404 }
      )
    }

    const body = await req.json()
    const data = updateWatchlistSchema.parse(body)

    // Handle completedAt based on status transitions
    let completedAt: Date | null | undefined = undefined
    if (data.status !== undefined && data.status !== existing.status) {
      if (data.status === 'completed') {
        completedAt = new Date()
      } else {
        completedAt = null
      }
    }

    const updateData: Prisma.WatchlistItemUpdateInput = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.type !== undefined) updateData.type = data.type
    if (data.genre !== undefined) updateData.genre = data.genre
    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.status !== undefined) updateData.status = data.status
    if (data.rating !== undefined) updateData.rating = data.rating ?? null
    if (data.notesMd !== undefined) updateData.notesMd = data.notesMd
    if (data.coverUrl !== undefined) updateData.coverUrl = data.coverUrl || null
    if (data.year !== undefined) updateData.year = data.year ?? null
    if (data.platform !== undefined) updateData.platform = data.platform || null
    if (completedAt !== undefined) updateData.completedAt = completedAt

    const item = await prisma.watchlistItem.update({
      where: { id: itemId },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: serializeItem(item) })
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error)
    }
    console.error('PATCH /api/watchlist/[id] error:', error)
    return internalError()
  }
})

export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const itemId = extractItemId(req)
    const item = await getOwnedItem(itemId, user)

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Watchlist item not found' },
        },
        { status: 404 }
      )
    }

    await prisma.watchlistItem.delete({ where: { id: itemId } })

    return NextResponse.json({ success: true, data: { id: itemId } })
  } catch (error) {
    console.error('DELETE /api/watchlist/[id] error:', error)
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
