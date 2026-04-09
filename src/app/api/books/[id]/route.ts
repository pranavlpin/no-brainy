import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { updateBookSchema } from '@/lib/validations/books'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'
import type { AuthUser } from '@/lib/types/auth'

function extractBookId(req: NextRequest): string {
  const segments = new URL(req.url).pathname.split('/')
  // /api/books/[id] -> id is the last segment
  return segments[segments.length - 1]
}

async function getOwnedBook(bookId: string, user: AuthUser) {
  return prisma.book.findFirst({
    where: { id: bookId, userId: user.id },
  })
}

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const bookId = extractBookId(req)
    const book = await getOwnedBook(bookId, user)

    if (!book) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Book not found' },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: serializeBook(book) })
  } catch {
    return internalError()
  }
})

export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const bookId = extractBookId(req)
    const existing = await getOwnedBook(bookId, user)

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Book not found' },
        },
        { status: 404 }
      )
    }

    const body = await req.json()
    const data = updateBookSchema.parse(body)

    // Handle completedAt based on status transitions
    let completedAt: Date | null | undefined = undefined
    if (data.status !== undefined && data.status !== existing.status) {
      if (data.status === 'completed') {
        completedAt = new Date()
      } else {
        completedAt = null
      }
    }

    const updateData: Prisma.BookUpdateInput = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.author !== undefined) updateData.author = data.author
    if (data.coverUrl !== undefined) updateData.coverUrl = data.coverUrl || null
    if (data.genre !== undefined) updateData.genre = data.genre
    if (data.status !== undefined) updateData.status = data.status
    if (data.rating !== undefined) updateData.rating = data.rating ?? null
    if (data.summaryMd !== undefined) updateData.summaryMd = data.summaryMd
    if (data.keyIdeas !== undefined) updateData.keyIdeas = data.keyIdeas as Prisma.InputJsonValue
    if (data.quotes !== undefined) updateData.quotes = data.quotes as Prisma.InputJsonValue
    if (data.learningsMd !== undefined) updateData.learningsMd = data.learningsMd
    if (data.applicationMd !== undefined) updateData.applicationMd = data.applicationMd
    if (data.pagesTotal !== undefined) updateData.pagesTotal = data.pagesTotal ?? null
    if (data.pagesRead !== undefined) updateData.pagesRead = data.pagesRead
    if (completedAt !== undefined) updateData.completedAt = completedAt

    const book = await prisma.book.update({
      where: { id: bookId },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: serializeBook(book) })
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error)
    }
    return internalError()
  }
})

export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const bookId = extractBookId(req)
    const book = await getOwnedBook(bookId, user)

    if (!book) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Book not found' },
        },
        { status: 404 }
      )
    }

    await prisma.book.delete({ where: { id: bookId } })

    return NextResponse.json({ success: true, data: { id: bookId } })
  } catch {
    return internalError()
  }
})

function serializeBook(book: {
  id: string
  userId: string
  title: string
  author: string | null
  coverUrl: string | null
  genre: string[]
  status: string
  rating: number | null
  summaryMd: string
  keyIdeas: Prisma.JsonValue
  quotes: Prisma.JsonValue
  learningsMd: string
  applicationMd: string
  pagesTotal: number | null
  pagesRead: number
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: book.id,
    userId: book.userId,
    title: book.title,
    author: book.author,
    coverUrl: book.coverUrl,
    genre: book.genre,
    status: book.status,
    rating: book.rating,
    summaryMd: book.summaryMd,
    keyIdeas: book.keyIdeas,
    quotes: book.quotes,
    learningsMd: book.learningsMd,
    applicationMd: book.applicationMd,
    pagesTotal: book.pagesTotal,
    pagesRead: book.pagesRead,
    completedAt: book.completedAt?.toISOString() ?? null,
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
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
