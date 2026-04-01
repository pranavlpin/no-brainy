import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { withAuth } from '@/lib/auth/middleware'
import { toTsQuery } from '@/lib/db/search'
import type { NoteResponse } from '@/lib/types/notes'
import type { ApiResponse } from '@/lib/types/api'

interface RawNoteRow {
  id: string
  user_id: string
  title: string
  content_md: string
  tags: string[]
  is_pinned: boolean
  is_deleted: boolean
  deleted_at: Date | null
  word_count: number
  created_at: Date
  updated_at: Date
  rank?: number
}

function formatRawNote(row: RawNoteRow): NoteResponse {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    contentMd: row.content_md,
    tags: row.tags ?? [],
    isPinned: row.is_pinned,
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at?.toISOString() ?? null,
    wordCount: row.word_count,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
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
    const q = searchParams.get('q')?.trim()

    if (!q || q.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Search query "q" is required',
          },
        },
        { status: 400 }
      )
    }

    // For very short queries (< 3 chars), fall back to Prisma contains
    if (q.length < 3) {
      const notes = await prisma.note.findMany({
        where: {
          userId: user.id,
          isDeleted: false,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { contentMd: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      })

      const response: ApiResponse<NoteResponse[]> = {
        success: true,
        data: notes.map(formatNote),
      }

      return NextResponse.json(response)
    }

    // Full-text search using raw query with relevance ranking
    const tsQuery = toTsQuery(q)

    const notes = await prisma.$queryRaw<RawNoteRow[]>(
      Prisma.sql`
        SELECT id, user_id, title, content_md, tags, is_pinned, is_deleted,
               deleted_at, word_count, created_at, updated_at,
               ts_rank(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content_md, '')),
                       to_tsquery('english', ${tsQuery})) AS rank
        FROM notes
        WHERE user_id = ${user.id}
          AND is_deleted = false
          AND to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content_md, '')) @@ to_tsquery('english', ${tsQuery})
        ORDER BY rank DESC
        LIMIT 20
      `
    )

    const response: ApiResponse<NoteResponse[]> = {
      success: true,
      data: notes.map(formatRawNote),
    }

    return NextResponse.json(response)
  } catch {
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
