import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { createTaskSchema, taskQuerySchema } from '@/lib/validations/tasks'
import { formatTask } from '@/lib/tasks/format'
import { priorityRank } from '@/lib/tasks/priority'
import { addDays, dateFromKey } from '@/lib/dates'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'

const ACTIVE_STATUSES = ['pending', 'in_progress'] as const

/** Inclusive date-key range to a half-open UTC `Date` range for `@db.Date` columns. */
function dateRange(from?: string, to?: string): Prisma.DateTimeNullableFilter | undefined {
  if (!from && !to) return undefined
  const filter: Prisma.DateTimeNullableFilter = {}
  if (from) filter.gte = dateFromKey(from)
  if (to) filter.lt = dateFromKey(addDays(to, 1))
  return filter
}

function validationError(error: ZodError, message: string) {
  const details: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const field = issue.path.join('.')
    if (!details[field]) details[field] = []
    details[field].push(issue.message)
  }
  return NextResponse.json(
    { success: false, error: { code: 'VALIDATION_ERROR', message, details } },
    { status: 400 }
  )
}

const internalError = () =>
  NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    { status: 500 }
  )

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

    if (query.status === 'active') where.status = { in: [...ACTIVE_STATUSES] }
    else if (query.status) where.status = query.status
    if (query.priority) where.priority = query.priority
    if (query.quadrant) where.quadrant = query.quadrant
    if (query.goalId) where.goalId = query.goalId
    if (query.context) where.context = query.context
    if (query.parentTaskId) {
      where.parentTaskId = query.parentTaskId === 'null' ? null : query.parentTaskId
    }
    if (query.tags) {
      where.tags = { hasSome: query.tags.split(',') }
    }
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' }
    }
    const due = query.dueDate
      ? dateRange(query.dueDate, query.dueDate)
      : dateRange(query.dueDateFrom, query.dueDateTo)
    if (due) where.dueDate = due
    const planned = query.plannedDate
      ? dateRange(query.plannedDate, query.plannedDate)
      : dateRange(query.plannedDateFrom, query.plannedDateTo)
    if (planned) where.plannedDate = planned

    // Priority sorts by rank (0 = urgent) so "highest first" means ascending rank.
    // Date sorts keep rows without a date at the end regardless of direction.
    const orderBy: Prisma.TaskOrderByWithRelationInput[] =
      sortBy === 'priority'
        ? [{ priorityRank: sortOrder === 'desc' ? 'asc' : 'desc' }, { orderIndex: 'asc' }]
        : sortBy === 'dueDate' || sortBy === 'plannedDate'
          ? [{ [sortBy]: { sort: sortOrder, nulls: 'last' } }, { priorityRank: 'asc' }]
          : [{ [sortBy]: sortOrder }, { createdAt: 'asc' }]

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { subtasks: true } },
        },
      }),
      prisma.task.count({ where }),
    ])

    const items = tasks.map((task) => ({
      ...formatTask(task),
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
      },
    })
  } catch (error) {
    if (error instanceof ZodError) return validationError(error, 'Invalid query parameters')
    return internalError()
  }
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const data = createTaskSchema.parse(body)

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title: data.title,
        descriptionMd: data.descriptionMd,
        priority: data.priority,
        priorityRank: priorityRank(data.priority),
        status: data.status,
        tags: data.tags,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        plannedDate: data.plannedDate ? dateFromKey(data.plannedDate) : null,
        estimatedMinutes: data.estimatedMinutes ?? null,
        effort: data.effort ?? null,
        context: data.context ?? null,
        parentTaskId: data.parentTaskId ?? null,
        goalId: data.goalId ?? null,
        quadrant: data.quadrant ?? null,
        isRecurring: data.isRecurring,
        rrule: data.rrule ?? null,
        completedAt: data.status === 'completed' ? new Date() : null,
      },
    })

    return NextResponse.json({ success: true, data: formatTask(task) }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) return validationError(error, 'Invalid input')
    return internalError()
  }
})
