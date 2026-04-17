import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { createBookmarkSchema, bookmarkQuerySchema } from '@/lib/validations/bookmarks'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const url = new URL(req.url)
    const params = Object.fromEntries(url.searchParams.entries())
    const query = bookmarkQuerySchema.parse(params)

    const where: Prisma.BookmarkWhereInput = { userId: user.id }

    if (query.isPinned !== undefined) {
      where.isPinned = query.isPinned
    }

    if (query.tags) {
      where.tags = { has: query.tags }
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { url: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      prisma.bookmark.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.bookmark.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: items.map(serializeBookmark),
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
    console.error('GET /api/bookmarks error:', error)
    return internalError()
  }
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const data = createBookmarkSchema.parse(body)

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: user.id,
        title: data.title,
        url: data.url,
        description: data.description || null,
        tags: data.tags,
        favicon: data.favicon || null,
        isPinned: false,
      },
    })

    return NextResponse.json(
      { success: true, data: serializeBookmark(bookmark) },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error)
    }
    console.error('POST /api/bookmarks error:', error)
    return internalError()
  }
})

function serializeBookmark(bookmark: {
  id: string
  userId: string
  title: string
  url: string
  description: string | null
  tags: string[]
  favicon: string | null
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: bookmark.id,
    userId: bookmark.userId,
    title: bookmark.title,
    url: bookmark.url,
    description: bookmark.description,
    tags: bookmark.tags,
    favicon: bookmark.favicon,
    isPinned: bookmark.isPinned,
    createdAt: bookmark.createdAt.toISOString(),
    updatedAt: bookmark.updatedAt.toISOString(),
  }
}

function validationError(error: ZodError) {
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

function internalError() {
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
