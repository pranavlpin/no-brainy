import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth/middleware'
import type { ApiResponse } from '@/lib/types/api'

const VALID_LINKED_TYPES = ['note', 'book'] as const

function extractTaskId(url: string): string {
  const segments = new URL(url).pathname.split('/')
  const tasksIndex = segments.indexOf('tasks')
  return segments[tasksIndex + 1]
}

function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
    { status: 401 }
  )
}

function notFoundResponse(entity = 'Task') {
  return NextResponse.json(
    { success: false, error: { code: 'NOT_FOUND', message: `${entity} not found` } },
    { status: 404 }
  )
}

export interface TaskLinkedEntityPreview {
  taskId: string
  linkedType: string
  linkedId: string
  title: string
  extra?: Record<string, unknown>
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const taskId = extractTaskId(req.url)

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: user.id },
    })
    if (!task) return notFoundResponse()

    const links = await prisma.taskLink.findMany({
      where: { taskId },
    })

    const previews: TaskLinkedEntityPreview[] = []

    for (const link of links) {
      let title = 'Unknown'
      let extra: Record<string, unknown> | undefined

      switch (link.linkedType) {
        case 'note': {
          const target = await prisma.note.findUnique({
            where: { id: link.linkedId },
            select: { title: true },
          })
          title = target?.title || 'Untitled Note'
          break
        }
        case 'book': {
          const target = await prisma.book.findUnique({
            where: { id: link.linkedId },
            select: { title: true, author: true },
          })
          if (target) {
            title = target.title
            extra = { author: target.author }
          }
          break
        }
      }

      previews.push({
        taskId: link.taskId,
        linkedType: link.linkedType,
        linkedId: link.linkedId,
        title,
        extra,
      })
    }

    const response: ApiResponse<TaskLinkedEntityPreview[]> = {
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

    const taskId = extractTaskId(req.url)

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: user.id },
    })
    if (!task) return notFoundResponse()

    const body = await req.json()
    const { linkedType, linkedId } = body as { linkedType: string; linkedId: string }

    if (!linkedType || !linkedId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'linkedType and linkedId are required' } },
        { status: 400 }
      )
    }

    if (!VALID_LINKED_TYPES.includes(linkedType as typeof VALID_LINKED_TYPES[number])) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: `linkedType must be one of: ${VALID_LINKED_TYPES.join(', ')}` } },
        { status: 400 }
      )
    }

    // Verify target exists and belongs to user
    let targetExists = false
    switch (linkedType) {
      case 'note':
        targetExists = !!(await prisma.note.findFirst({ where: { id: linkedId, userId: user.id, isDeleted: false } }))
        break
      case 'book':
        targetExists = !!(await prisma.book.findFirst({ where: { id: linkedId, userId: user.id } }))
        break
    }

    if (!targetExists) {
      return notFoundResponse('Target entity')
    }

    const link = await prisma.taskLink.create({
      data: { taskId, linkedType, linkedId },
    })

    const response: ApiResponse<{ taskId: string; linkedType: string; linkedId: string }> = {
      success: true,
      data: {
        taskId: link.taskId,
        linkedType: link.linkedType,
        linkedId: link.linkedId,
      },
    }
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
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

    const taskId = extractTaskId(req.url)

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: user.id },
    })
    if (!task) return notFoundResponse()

    const body = await req.json()
    const { linkedType, linkedId } = body as { linkedType: string; linkedId: string }

    if (!linkedType || !linkedId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'linkedType and linkedId are required' } },
        { status: 400 }
      )
    }

    const existing = await prisma.taskLink.findUnique({
      where: { taskId_linkedType_linkedId: { taskId, linkedType, linkedId } },
    })

    if (!existing) {
      return notFoundResponse('Link')
    }

    await prisma.taskLink.delete({
      where: { taskId_linkedType_linkedId: { taskId, linkedType, linkedId } },
    })

    return NextResponse.json({ success: true, data: { message: 'Link removed' } })
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
