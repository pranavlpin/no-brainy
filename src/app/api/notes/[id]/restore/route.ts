import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth/middleware'
import type { NoteResponse } from '@/lib/types/notes'
import type { ApiResponse } from '@/lib/types/api'

function extractNoteId(url: string): string {
  const segments = new URL(url).pathname.split('/')
  const notesIndex = segments.indexOf('notes')
  return segments[notesIndex + 1]
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

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    const noteId = extractNoteId(req.url)

    const existing = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: user.id,
        isDeleted: true,
      },
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Deleted note not found',
          },
        },
        { status: 404 }
      )
    }

    const note = await prisma.note.update({
      where: { id: noteId },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    })

    const response: ApiResponse<NoteResponse> = {
      success: true,
      data: formatNote(note),
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
}
