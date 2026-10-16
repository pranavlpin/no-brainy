import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { createTaskSchema, taskQuerySchema } from '@/lib/validations/tasks'
import { serializeTask } from '@/lib/tasks/serialize'
import { initializeRoutine, advanceRoutine } from '@/lib/tasks/routine-service'
import { validTaskRelations } from '@/lib/tasks/relations'
import { addCalendarDays, todayInTimezone } from '@/lib/dates/calendar'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const queryObj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryObj[key] = value
    })

    const query = taskQuerySchema.parse(queryObj)
    const { page, pageSize, sortBy, sortOrder } = query

    const where: Prisma.TaskWhereInput = { userId: user.id }

    if (query.status) where.status = { in: query.status }
    if (query.priority) where.priority = { in: query.priority }
    if (query.quadrant) where.quadrant = query.quadrant
    if (query.projectId) where.projectId = query.projectId
    if (query.context) where.context = query.context
    if (query.plannedDate) where.plannedDate = new Date(`${query.plannedDate}T00:00:00Z`)
    if (query.goalId) where.goalId = query.goalId
    if (query.parentTaskId) {
      where.parentTaskId = query.parentTaskId === 'null' ? null : query.parentTaskId
    }
    if (query.tags) {
      where.tags = { hasSome: query.tags.split(',') }
    }
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' }
    }
    const from = query.dueDate ?? query.dueDateFrom
    const to = query.dueDate ?? query.dueDateTo
    if (from || to)
      where.dueDate = {
        ...(from && { gte: new Date(`${from}T00:00:00.000Z`) }),
        ...(to && { lt: new Date(`${addCalendarDays(to, 1)}T00:00:00.000Z`) }),
      }

    // Priority is a domain rank, not alphabetical order. Sort before paginating.
    const rank: Record<string, number> = { low: 1, medium: 2, high: 3, urgent: 4 }
    const [matching, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: sortBy === 'priority' ? [{ id: 'asc' }] : [{ [sortBy]: sortOrder }, { id: 'asc' }],
        ...(sortBy !== 'priority' && { skip: (page - 1) * pageSize, take: pageSize }),
        include: { _count: { select: { subtasks: { where: { userId: user.id } } } } },
      }),
      prisma.task.count({ where }),
    ])
    const tasks =
      sortBy === 'priority'
        ? matching
            .sort(
              (a, b) =>
                ((rank[a.priority] ?? 0) - (rank[b.priority] ?? 0)) *
                  (sortOrder === 'asc' ? 1 : -1) || a.id.localeCompare(b.id)
            )
            .slice((page - 1) * pageSize, page * pageSize)
        : matching

    const items = tasks.map((task) => ({
      ...serializeTask(task),
      subtasksCount: task._count.subtasks,
    }))

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
        today: todayInTimezone(user.timezone),
        timezone: user.timezone,
      },
    })
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
          error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details },
        },
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

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const data = createTaskSchema.parse(body)

    if (!(await validTaskRelations(prisma, user.id, data))) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_RELATION',
            message: 'Choose a task and goal from your own workspace',
          },
        },
        { status: 400 }
      )
    }

    const task = await prisma.$transaction(async (db) => {
      const created = await db.task.create({
        data: {
          userId: user.id,
          title: data.title,
          projectId: data.projectId ?? null,
          plannedDate: data.plannedDate ? new Date(`${data.plannedDate}T00:00:00Z`) : null,
          estimatedMinutes: data.estimatedMinutes ?? null,
          effort: data.effort ?? null,
          context: data.context ?? null,
          routinePaused: data.routinePaused ?? false,
          descriptionMd: data.descriptionMd,
          priority: data.priority,
          status: data.status,
          tags: data.tags,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          parentTaskId: data.parentTaskId ?? null,
          goalId: data.goalId ?? null,
          quadrant: data.quadrant ?? null,
          isRecurring: data.isRecurring,
          rrule: data.rrule ?? null,
          completedAt: data.status === 'completed' ? new Date() : null,
        },
      })
      const initialized = await initializeRoutine(db, created, todayInTimezone(user.timezone))
      if (initialized.status === 'completed')
        await advanceRoutine(db, initialized, todayInTimezone(user.timezone))
      return initialized
    })

    return NextResponse.json(
      {
        success: true,
        data: serializeTask(task),
      },
      { status: 201 }
    )
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
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details },
        },
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
