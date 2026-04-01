import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth/middleware'
import { updateNoteSchema } from '@/lib/validations/notes'
import { ZodError } from 'zod'
import type { NoteResponse, NoteLinkResponse } from '@/lib/types/notes'
import type { ApiResponse } from '@/lib/types/api'

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

type NoteWithLinks = {
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
  noteLinks?: { id: string; sourceId: string; targetType: string; targetId: string; createdAt: Date }[]
  linkedFrom?: { id: string; sourceId: string; targetType: string; targetId: string; createdAt: Date }[]
}

function formatNote(note: NoteWithLinks): NoteResponse {
  const result: NoteResponse = {
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

  if (note.noteLinks) {
    result.noteLinks = note.noteLinks.map((link): NoteLinkResponse => ({
      id: link.id,
      sourceId: link.sourceId,
      targetType: link.targetType,
      targetId: link.targetId,
      createdAt: link.createdAt.toISOString(),
    }))
  }

  if (note.linkedFrom) {
    result.linkedFrom = note.linkedFrom.map((link): NoteLinkResponse => ({
      id: link.id,
      sourceId: link.sourceId,
      targetType: link.targetType,
      targetId: link.targetId,
      createdAt: link.createdAt.toISOString(),
    }))
  }

  return result
}

function extractNoteId(url: string): string {
  const segments = new URL(url).pathname.split('/')
  // /api/notes/[id] or /api/notes/[id]/restore
  const notesIndex = segments.indexOf('notes')
  return segments[notesIndex + 1]
}

function unauthorizedResponse() {
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

function notFoundResponse() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Note not found',
      },
    },
    { status: 404 }
  )
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const noteId = extractNoteId(req.url)

    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: user.id,
        isDeleted: false,
      },
      include: {
        noteLinks: true,
        linkedFrom: true,
      },
    })

    if (!note) return notFoundResponse()

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

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const noteId = extractNoteId(req.url)

    const existing = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: user.id,
        isDeleted: false,
      },
    })

    if (!existing) return notFoundResponse()

    const body = await req.json()
    const data = updateNoteSchema.parse(body)

    const updateData: Record<string, unknown> = { ...data }

    if (data.contentMd !== undefined) {
      updateData.wordCount = countWords(data.contentMd)
    }

    const note = await prisma.note.update({
      where: { id: noteId },
      data: updateData,
    })

    const response: ApiResponse<NoteResponse> = {
      success: true,
      data: formatNote(note),
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
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const noteId = extractNoteId(req.url)

    const existing = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: user.id,
        isDeleted: false,
      },
    })

    if (!existing) return notFoundResponse()

    await prisma.note.update({
      where: { id: noteId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: { message: 'Note deleted successfully' },
    })
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
