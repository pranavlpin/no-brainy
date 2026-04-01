import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth/middleware'
import type { ApiResponse } from '@/lib/types/api'

const VALID_TARGET_TYPES = ['note', 'task', 'book', 'deck'] as const

function extractNoteId(url: string): string {
  const segments = new URL(url).pathname.split('/')
  const notesIndex = segments.indexOf('notes')
  return segments[notesIndex + 1]
}

function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
    { status: 401 }
  )
}

function notFoundResponse(entity = 'Note') {
  return NextResponse.json(
    { success: false, error: { code: 'NOT_FOUND', message: `${entity} not found` } },
    { status: 404 }
  )
}

export interface LinkedEntityPreview {
  id: string
  targetType: string
  targetId: string
  createdAt: string
  title: string
  extra?: Record<string, unknown>
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const noteId = extractNoteId(req.url)

    const note = await prisma.note.findFirst({
      where: { id: noteId, userId: user.id, isDeleted: false },
    })
    if (!note) return notFoundResponse()

    const links = await prisma.noteLink.findMany({
      where: { sourceId: noteId },
      orderBy: { createdAt: 'desc' },
    })

    const previews: LinkedEntityPreview[] = []

    for (const link of links) {
      let title = 'Unknown'
      let extra: Record<string, unknown> | undefined

      switch (link.targetType) {
        case 'note': {
          const target = await prisma.note.findUnique({
            where: { id: link.targetId },
            select: { title: true },
          })
          title = target?.title || 'Untitled Note'
          break
        }
        case 'task': {
          const target = await prisma.task.findUnique({
            where: { id: link.targetId },
            select: { title: true, status: true, priority: true },
          })
          if (target) {
            title = target.title
            extra = { status: target.status, priority: target.priority }
          }
          break
        }
        case 'book': {
          const target = await prisma.book.findUnique({
            where: { id: link.targetId },
            select: { title: true, author: true },
          })
          if (target) {
            title = target.title
            extra = { author: target.author }
          }
          break
        }
        case 'deck': {
          const target = await prisma.deck.findUnique({
            where: { id: link.targetId },
            select: { name: true },
          })
          title = target?.name || 'Untitled Deck'
          break
        }
      }

      previews.push({
        id: link.id,
        targetType: link.targetType,
        targetId: link.targetId,
        createdAt: link.createdAt.toISOString(),
        title,
        extra,
      })
    }

    const response: ApiResponse<LinkedEntityPreview[]> = {
      success: true,
      data: previews,
    }
    return NextResponse.json(response)
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const noteId = extractNoteId(req.url)

    const note = await prisma.note.findFirst({
      where: { id: noteId, userId: user.id, isDeleted: false },
    })
    if (!note) return notFoundResponse()

    const body = await req.json()
    const { targetType, targetId } = body as { targetType: string; targetId: string }

    if (!targetType || !targetId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'targetType and targetId are required' } },
        { status: 400 }
      )
    }

    if (!VALID_TARGET_TYPES.includes(targetType as typeof VALID_TARGET_TYPES[number])) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: `targetType must be one of: ${VALID_TARGET_TYPES.join(', ')}` } },
        { status: 400 }
      )
    }

    // Verify target exists and belongs to user
    let targetExists = false
    switch (targetType) {
      case 'note':
        targetExists = !!(await prisma.note.findFirst({ where: { id: targetId, userId: user.id, isDeleted: false } }))
        break
      case 'task':
        targetExists = !!(await prisma.task.findFirst({ where: { id: targetId, userId: user.id } }))
        break
      case 'book':
        targetExists = !!(await prisma.book.findFirst({ where: { id: targetId, userId: user.id } }))
        break
      case 'deck':
        targetExists = !!(await prisma.deck.findFirst({ where: { id: targetId, userId: user.id } }))
        break
    }

    if (!targetExists) {
      return notFoundResponse('Target entity')
    }

    const link = await prisma.noteLink.create({
      data: { sourceId: noteId, targetType, targetId },
    })

    const response: ApiResponse<{ id: string; sourceId: string; targetType: string; targetId: string; createdAt: string }> = {
      success: true,
      data: {
        id: link.id,
        sourceId: link.sourceId,
        targetType: link.targetType,
        targetId: link.targetId,
        createdAt: link.createdAt.toISOString(),
      },
    }
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    // Handle unique constraint violation (duplicate link)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'This link already exists' } },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const noteId = extractNoteId(req.url)

    const note = await prisma.note.findFirst({
      where: { id: noteId, userId: user.id, isDeleted: false },
    })
    if (!note) return notFoundResponse()

    const body = await req.json()
    const { targetType, targetId } = body as { targetType: string; targetId: string }

    if (!targetType || !targetId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'targetType and targetId are required' } },
        { status: 400 }
      )
    }

    const existing = await prisma.noteLink.findUnique({
      where: { sourceId_targetType_targetId: { sourceId: noteId, targetType, targetId } },
    })

    if (!existing) {
      return notFoundResponse('Link')
    }

    await prisma.noteLink.delete({
      where: { sourceId_targetType_targetId: { sourceId: noteId, targetType, targetId } },
    })

    return NextResponse.json({ success: true, data: { message: 'Link removed' } })
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
