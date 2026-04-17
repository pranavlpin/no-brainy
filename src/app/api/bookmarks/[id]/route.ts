import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { updateBookmarkSchema } from '@/lib/validations/bookmarks'
import { ZodError } from 'zod'
import type { AuthUser } from '@/lib/types/auth'

function extractBookmarkId(req: NextRequest): string {
  const segments = new URL(req.url).pathname.split('/')
  return segments[segments.length - 1]
}

async function getOwnedBookmark(bookmarkId: string, user: AuthUser) {
  return prisma.bookmark.findFirst({
    where: { id: bookmarkId, userId: user.id },
  })
}

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const bookmarkId = extractBookmarkId(req)
    const bookmark = await getOwnedBookmark(bookmarkId, user)

    if (!bookmark) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Bookmark not found' },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: serializeBookmark(bookmark) })
  } catch (error) {
    console.error('GET /api/bookmarks/[id] error:', error)
    return internalError()
  }
})

export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const bookmarkId = extractBookmarkId(req)
    const existing = await getOwnedBookmark(bookmarkId, user)

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Bookmark not found' },
        },
        { status: 404 }
      )
    }

    const body = await req.json()
    const data = updateBookmarkSchema.parse(body)

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.url !== undefined) updateData.url = data.url
    if (data.description !== undefined) updateData.description = data.description
    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.favicon !== undefined) updateData.favicon = data.favicon || null
    if (data.isPinned !== undefined) updateData.isPinned = data.isPinned

    const bookmark = await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: serializeBookmark(bookmark) })
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error)
    }
    console.error('PATCH /api/bookmarks/[id] error:', error)
    return internalError()
  }
})

export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const bookmarkId = extractBookmarkId(req)
    const bookmark = await getOwnedBookmark(bookmarkId, user)

    if (!bookmark) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Bookmark not found' },
        },
        { status: 404 }
      )
    }

    await prisma.bookmark.delete({ where: { id: bookmarkId } })

    return NextResponse.json({ success: true, data: { id: bookmarkId } })
  } catch (error) {
    console.error('DELETE /api/bookmarks/[id] error:', error)
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
