import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { createNoteSchema, noteQuerySchema } from '@/lib/validations/notes'
import { ZodError } from 'zod'
import type { NoteResponse } from '@/lib/types/notes'
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'
import type { Prisma } from '@prisma/client'

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function formatNote(note: {
  id: string
  userId: string
  title: string
  contentMd: string
  tags: string[]
  isPinned: boolean
  isDeleted: boolean
  deletedAt: Date | null
  wordCount: number
  createdAt: Date
  updatedAt: Date
}): NoteResponse {
  return {
    id: note.id,
    userId: note.userId,
    title: note.title,
    contentMd: note.contentMd,
    tags: note.tags,
    isPinned: note.isPinned,
    isDeleted: note.isDeleted,
    deletedAt: note.deletedAt?.toISOString() ?? null,
    wordCount: note.wordCount,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  }
}

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const queryObj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryObj[key] = value
    })

    const query = noteQuerySchema.parse(queryObj)
    const { page, pageSize, search, tags, isPinned, sortBy, sortOrder } = query

    const where: Prisma.NoteWhereInput = {
      userId: user.id,
      isDeleted: false,
    }

    if (tags) {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
      if (tagList.length > 0) {
        where.tags = { hasSome: tagList }
      }
    }

    if (isPinned !== undefined) {
      where.isPinned = isPinned
    }

    if (search && search.trim().length > 0) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { contentMd: { contains: search, mode: 'insensitive' } },
      ]
    }

    const skip = (page - 1) * pageSize

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }),
      prisma.note.count({ where }),
    ])

    const response: ApiResponse<PaginatedResponse<NoteResponse>> = {
      success: true,
      data: {
        items: notes.map(formatNote),
        total,
        page,
        pageSize,
        hasMore: skip + notes.length < total,
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
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const data = createNoteSchema.parse(body)

    const wordCount = countWords(data.contentMd)

    const note = await prisma.note.create({
      data: {
        userId: user.id,
        title: data.title,
        contentMd: data.contentMd,
        tags: data.tags,
        isPinned: data.isPinned,
        wordCount,
      },
    })

    const response: ApiResponse<NoteResponse> = {
      success: true,
      data: formatNote(note),
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
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
})
