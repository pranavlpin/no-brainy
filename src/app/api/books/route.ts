import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { createBookSchema, bookQuerySchema } from '@/lib/validations/books'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const url = new URL(req.url)
    const params = Object.fromEntries(url.searchParams.entries())
    const query = bookQuerySchema.parse(params)

    const where: Prisma.BookWhereInput = { userId: user.id }

    if (query.status) {
      where.status = query.status
    }

    if (query.genre) {
      where.genre = { has: query.genre }
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { author: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      prisma.book.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.book.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: items.map(serializeBook),
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
    return internalError()
  }
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const data = createBookSchema.parse(body)

    const book = await prisma.book.create({
      data: {
        userId: user.id,
        title: data.title,
        author: data.author,
        coverUrl: data.coverUrl || null,
        genre: data.genre,
        status: data.status,
        rating: data.rating ?? null,
        summaryMd: data.summaryMd,
        keyIdeas: data.keyIdeas as Prisma.InputJsonValue,
        quotes: data.quotes as Prisma.InputJsonValue,
        learningsMd: data.learningsMd,
        applicationMd: data.applicationMd,
        pagesTotal: data.pagesTotal ?? null,
        pagesRead: data.pagesRead,
        completedAt: data.status === 'completed' ? new Date() : null,
      },
    })

    return NextResponse.json(
      { success: true, data: serializeBook(book) },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error)
    }
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
