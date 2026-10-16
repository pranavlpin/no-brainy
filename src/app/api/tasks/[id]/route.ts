import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { updateTaskSchema } from '@/lib/validations/tasks'
import { serializeTask as formatTask } from '@/lib/tasks/serialize'
import { todayInTimezone } from '@/lib/dates/calendar'
import { initializeRoutine, advanceRoutine } from '@/lib/tasks/routine-service'
import { validTaskRelations } from '@/lib/tasks/relations'
import { ZodError } from 'zod'
import type { AuthUser } from '@/lib/types/auth'

async function handleGet(req: NextRequest, user: AuthUser, id: string): Promise<NextResponse> {
  const task = await prisma.task.findFirst({
    where: { id, userId: user.id },
    include: {
      subtasks: { where: { userId: user.id }, orderBy: { orderIndex: 'asc' } },
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

  if (!(await validTaskRelations(prisma, user.id, data, id))) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_RELATION',
          message: 'Choose a task and goal from your own workspace without creating a cycle',
        },
      },
      { status: 400 }
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

  const task = await prisma.$transaction(async (db) => {
    const changed = await db.task.updateMany({
      where: {
        id,
        userId: user.id,
        ...(data.expectedUpdatedAt && { updatedAt: new Date(data.expectedUpdatedAt) }),
      },
      data: {
        ...(data.projectId !== undefined && { projectId: data.projectId }),
        ...(data.plannedDate !== undefined && {
          plannedDate: data.plannedDate ? new Date(`${data.plannedDate}T00:00:00Z`) : null,
        }),
        ...(data.context !== undefined && { context: data.context }),
        ...(data.estimatedMinutes !== undefined && { estimatedMinutes: data.estimatedMinutes }),
        ...(data.effort !== undefined && { effort: data.effort }),
        ...(data.routinePaused !== undefined && { routinePaused: data.routinePaused }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.descriptionMd !== undefined && { descriptionMd: data.descriptionMd }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        ...(data.parentTaskId !== undefined && { parentTaskId: data.parentTaskId ?? null }),
        ...(data.goalId !== undefined && { goalId: data.goalId ?? null }),
        ...(data.quadrant !== undefined && { quadrant: data.quadrant ?? null }),
        ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
        ...(data.rrule !== undefined && { rrule: data.rrule ?? null }),
        ...(completedAt !== undefined && { completedAt }),
        updatedAt: new Date(Math.max(Date.now(), existing.updatedAt.getTime() + 1)),
      },
    })
    if (!changed.count) return null
    const updated = await initializeRoutine(
      db,
      await db.task.findUniqueOrThrow({ where: { id } }),
      todayInTimezone(user.timezone)
    )
    if (
      updated.routineId &&
      (data.routinePaused !== undefined ||
        data.isRecurring !== undefined ||
        data.rrule !== undefined)
    ) {
      await db.task.update({
        where: { id: updated.routineId },
        data: {
          ...(data.routinePaused !== undefined && { routinePaused: data.routinePaused }),
          ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
          ...(data.rrule !== undefined && { rrule: data.rrule }),
        },
      })
      if (data.routinePaused !== undefined)
        await db.task.updateMany({
          where: { routineId: updated.routineId, userId: user.id },
          data: { routinePaused: data.routinePaused },
        })
    }
    if (
      data.plannedDate !== undefined &&
      (existing.plannedDate?.toISOString().slice(0, 10) ?? null) !== data.plannedDate
    ) {
      await db.taskPlanEvent.create({
        data: {
          userId: user.id,
          taskId: id,
          taskTitle: updated.title,
          fromDate: existing.plannedDate,
          toDate: updated.plannedDate,
        },
      })
    }
    if (
      data.projectId !== undefined ||
      data.status === 'completed' ||
      data.status === 'cancelled'
    ) {
      await db.project.updateMany({
        where: {
          userId: user.id,
          nextActionId: id,
          ...(data.status !== 'completed' &&
            data.status !== 'cancelled' &&
            updated.projectId && { id: { not: updated.projectId } }),
        },
        data: { nextActionId: null },
      })
    }
    if (data.status === 'completed')
      await advanceRoutine(db, updated, todayInTimezone(user.timezone))
    return db.task.findUniqueOrThrow({
      where: { id },
      include: {
        subtasks: { where: { userId: user.id }, orderBy: { orderIndex: 'asc' } },
        taskLinks: true,
      },
    })
  })
  if (!task)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'This task changed elsewhere. Keep your draft or load the current version.',
        },
      },
      { status: 409 }
    )
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
    return await handleGet(req, user, id)
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
    return await handlePut(req, user, id)
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
    return await handleDelete(req, user, id)
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
