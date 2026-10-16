import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { updateTaskSchema } from '@/lib/validations/tasks'
import { formatTask as formatTaskRow } from '@/lib/tasks/format'
import { priorityRank } from '@/lib/tasks/priority'
import { dateFromKey } from '@/lib/dates'
import { ZodError } from 'zod'
import type { AuthUser } from '@/lib/types/auth'
import type { Task } from '@prisma/client'

function formatTask(
  task: Task & {
    subtasks?: Task[]
    taskLinks?: Array<{ taskId: string; linkedType: string; linkedId: string }>
  }
) {
  return {
    ...formatTaskRow(task),
    subtasks: task.subtasks?.map((s) => formatTaskRow(s)),
    taskLinks: task.taskLinks,
  }
}

async function handleGet(req: NextRequest, user: AuthUser, id: string): Promise<NextResponse> {
  const task = await prisma.task.findFirst({
    where: { id, userId: user.id },
    include: {
      subtasks: { orderBy: { orderIndex: 'asc' } },
      taskLinks: true,
    },
  })

  if (!task) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' },
      },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: formatTask(task) })
}

async function handlePut(req: NextRequest, user: AuthUser, id: string): Promise<NextResponse> {
  const existing = await prisma.task.findFirst({
    where: { id, userId: user.id },
  })

  if (!existing) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' },
      },
      { status: 404 }
    )
  }

  const body = await req.json()
  const data = updateTaskSchema.parse(body)

  // Optimistic concurrency: a stale client must not overwrite a newer row.
  if (
    data.expectedUpdatedAt !== undefined &&
    new Date(data.expectedUpdatedAt).getTime() !== existing.updatedAt.getTime()
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'This task changed elsewhere. Reload before saving.',
          details: { updatedAt: existing.updatedAt.toISOString() },
        },
      },
      { status: 409 }
    )
  }

  // Handle completedAt based on status changes
  let completedAt: Date | null | undefined = undefined
  if (data.status !== undefined) {
    if (data.status === 'completed' && existing.status !== 'completed') {
      completedAt = new Date()
    } else if (data.status !== 'completed' && existing.status === 'completed') {
      completedAt = null
    }
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.descriptionMd !== undefined && { descriptionMd: data.descriptionMd }),
      ...(data.priority !== undefined && {
        priority: data.priority,
        priorityRank: priorityRank(data.priority),
      }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      ...(data.plannedDate !== undefined && {
        plannedDate: data.plannedDate ? dateFromKey(data.plannedDate) : null,
      }),
      ...(data.estimatedMinutes !== undefined && { estimatedMinutes: data.estimatedMinutes }),
      ...(data.effort !== undefined && { effort: data.effort }),
      ...(data.context !== undefined && { context: data.context }),
      ...(data.parentTaskId !== undefined && { parentTaskId: data.parentTaskId ?? null }),
      ...(data.goalId !== undefined && { goalId: data.goalId ?? null }),
      ...(data.quadrant !== undefined && { quadrant: data.quadrant ?? null }),
      ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
      ...(data.rrule !== undefined && { rrule: data.rrule ?? null }),
      ...(completedAt !== undefined && { completedAt }),
    },
    include: {
      subtasks: { orderBy: { orderIndex: 'asc' } },
      taskLinks: true,
    },
  })

  return NextResponse.json({ success: true, data: formatTask(task) })
}

async function handleDelete(req: NextRequest, user: AuthUser, id: string): Promise<NextResponse> {
  const existing = await prisma.task.findFirst({
    where: { id, userId: user.id },
  })

  if (!existing) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' },
      },
      { status: 404 }
    )
  }

  await prisma.task.delete({ where: { id } })

  return NextResponse.json({ success: true, data: { id } })
}

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').pop()!
    return handleGet(req, user, id)
  } catch (error) {
    if (error instanceof ZodError) {
      const details: Record<string, string[]> = {}
      for (const issue of error.issues) {
        const field = issue.path.join('.')
        if (!details[field]) details[field] = []
        details[field].push(issue.message)
      }
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details } },
        { status: 400 }
      )
    }
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})

export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').pop()!
    return handlePut(req, user, id)
  } catch (error) {
    if (error instanceof ZodError) {
      const details: Record<string, string[]> = {}
      for (const issue of error.issues) {
        const field = issue.path.join('.')
        if (!details[field]) details[field] = []
        details[field].push(issue.message)
      }
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details } },
        { status: 400 }
      )
    }
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})

export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').pop()!
    return handleDelete(req, user, id)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})
