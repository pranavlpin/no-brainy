import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { updateTaskSchema } from '@/lib/validations/tasks'
import { ZodError } from 'zod'
import type { AuthUser } from '@/lib/types/auth'

function formatTask(task: {
  id: string
  userId: string
  parentTaskId: string | null
  goalId: string | null
  title: string
  descriptionMd: string
  priority: string
  status: string
  tags: string[]
  dueDate: Date | null
  completedAt: Date | null
  isRecurring: boolean
  rrule: string | null
  quadrant: string | null
  orderIndex: number
  createdAt: Date
  updatedAt: Date
  subtasks?: Array<{
    id: string
    userId: string
    parentTaskId: string | null
    goalId: string | null
    title: string
    descriptionMd: string
    priority: string
    status: string
    tags: string[]
    dueDate: Date | null
    completedAt: Date | null
    isRecurring: boolean
    rrule: string | null
    quadrant: string | null
    orderIndex: number
    createdAt: Date
    updatedAt: Date
  }>
  taskLinks?: Array<{ taskId: string; linkedType: string; linkedId: string }>
}) {
  return {
    id: task.id,
    userId: task.userId,
    parentTaskId: task.parentTaskId,
    goalId: task.goalId,
    title: task.title,
    descriptionMd: task.descriptionMd,
    priority: task.priority,
    status: task.status,
    tags: task.tags,
    dueDate: task.dueDate?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    isRecurring: task.isRecurring,
    rrule: task.rrule,
    quadrant: task.quadrant,
    orderIndex: task.orderIndex,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    subtasks: task.subtasks?.map((s) => ({
      id: s.id,
      userId: s.userId,
      parentTaskId: s.parentTaskId,
      goalId: s.goalId,
      title: s.title,
      descriptionMd: s.descriptionMd,
      priority: s.priority,
      status: s.status,
      tags: s.tags,
      dueDate: s.dueDate?.toISOString() ?? null,
      completedAt: s.completedAt?.toISOString() ?? null,
      isRecurring: s.isRecurring,
      rrule: s.rrule,
      quadrant: s.quadrant,
      orderIndex: s.orderIndex,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    taskLinks: task.taskLinks,
  }
}

async function handleGet(
  req: NextRequest,
  user: AuthUser,
  id: string
): Promise<NextResponse> {
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

async function handlePut(
  req: NextRequest,
  user: AuthUser,
  id: string
): Promise<NextResponse> {
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
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
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

async function handleDelete(
  req: NextRequest,
  user: AuthUser,
  id: string
): Promise<NextResponse> {
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
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
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
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
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
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})
