import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { AuthUser } from '@/lib/types/auth'
import { serializeTask } from '@/lib/tasks/serialize'
import { updateDayPlanSchema } from '@/lib/validations/planner'
import { addCalendarDays } from '@/lib/dates/calendar'
import type { TimeBlock } from '@/lib/types/planner'
import { personalSettings } from '@/lib/data/settings'

/** Return one calendar plan and live task representations in the saved priority order. */
export async function readDayPlan(db: Prisma.TransactionClient, userId: string, date: string) {
  const planDate = new Date(`${date}T00:00:00Z`)
  const owner = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { timezone: true, preferences: true },
  })
  const defaults = personalSettings(owner.timezone, owner.preferences)
  const plan = await db.dayPlan.upsert({
    where: { userId_planDate: { userId, planDate } },
    create: {
      userId,
      planDate,
      availableMinutes: defaults.availableMinutes,
      workStart: defaults.workStart,
      workEnd: defaults.workEnd,
    },
    update: {},
  })
  const nextDay = new Date(`${addCalendarDays(date, 1)}T00:00:00Z`)
  const [linked, due, planned] = await Promise.all([
    db.task.findMany({
      where: {
        userId,
        id: { in: [...plan.focusTaskIds, ...(plan.growthTaskId ? [plan.growthTaskId] : [])] },
      },
    }),
    db.task.findMany({
      where: { userId, dueDate: { gte: planDate, lt: nextDay }, status: { not: 'cancelled' } },
      orderBy: { orderIndex: 'asc' },
    }),
    db.task.findMany({
      where: { userId, plannedDate: planDate, routinePaused: false, status: { not: 'cancelled' } },
      orderBy: { orderIndex: 'asc' },
    }),
  ])
  const map = new Map(linked.map((task) => [task.id, serializeTask(task)]))
  return {
    ...plan,
    planDate: date,
    timeBlocks: plan.timeBlocks as unknown as TimeBlock[],
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    focusTasks: plan.focusTaskIds.flatMap((id) => (map.has(id) ? [map.get(id)!] : [])),
    tasksDueToday: due.map(serializeTask),
    tasksDueOnDate: due.map(serializeTask),
    plannedTasks: planned.map(serializeTask),
    growthTask: plan.growthTaskId ? (map.get(plan.growthTaskId) ?? null) : null,
  }
}

/** Validate owned choices and save one versioned plan atomically; deadlines are never rewritten. */
export async function saveDayPlan(user: AuthUser, date: string, body: unknown) {
  const { expectedUpdatedAt, ...input } = updateDayPlanSchema.parse(body)
  const planDate = new Date(`${date}T00:00:00Z`)
  return prisma.$transaction(async (db) => {
    const defaults = personalSettings(user.timezone, user.preferences)
    const existing = await db.dayPlan.upsert({
      where: { userId_planDate: { userId: user.id, planDate } },
      create: {
        userId: user.id,
        planDate,
        availableMinutes: defaults.availableMinutes,
        workStart: defaults.workStart,
        workEnd: defaults.workEnd,
      },
      update: {},
    })
    const start = input.workStart === undefined ? existing.workStart : input.workStart
    const end = input.workEnd === undefined ? existing.workEnd : input.workEnd
    if (!!start !== !!end || (start && end && start >= end))
      return plannerError(
        'VALIDATION_ERROR',
        'Choose a working window that ends after it starts, or clear both times.',
        400
      )
    if (input.focusTaskIds) {
      const valid = await db.task.count({
        where: {
          userId: user.id,
          id: { in: input.focusTaskIds },
          OR: [
            { status: { in: ['pending', 'in_progress'] } },
            { id: { in: existing.focusTaskIds }, status: 'completed' },
          ],
        },
      })
      if (valid !== input.focusTaskIds.length)
        return plannerError('VALIDATION_ERROR', 'Choose active tasks from your own workspace.', 400)
    }
    if (
      input.growthTaskId &&
      input.growthTaskId !== existing.growthTaskId &&
      !(await db.task.findFirst({
        where: {
          id: input.growthTaskId,
          userId: user.id,
          status: { in: ['pending', 'in_progress'] },
        },
      }))
    )
      return plannerError(
        'VALIDATION_ERROR',
        'Choose an active growth action from your workspace.',
        400
      )
    const blockIds = [
      ...new Set(input.timeBlocks?.flatMap((block) => (block.taskId ? [block.taskId] : [])) ?? []),
    ]
    if (
      blockIds.length &&
      (await db.task.count({ where: { id: { in: blockIds }, userId: user.id } })) !==
        blockIds.length
    )
      return plannerError(
        'VALIDATION_ERROR',
        'A scheduled task is unavailable in your workspace.',
        400
      )
    const changed = await db.dayPlan.updateMany({
      where: {
        id: existing.id,
        ...(expectedUpdatedAt && { updatedAt: new Date(expectedUpdatedAt) }),
      },
      data: {
        ...input,
        timeBlocks: input.timeBlocks as Prisma.InputJsonValue | undefined,
        updatedAt: new Date(Math.max(Date.now(), existing.updatedAt.getTime() + 1)),
      },
    })
    if (!changed.count)
      return plannerError('CONFLICT', 'This day changed elsewhere. Your draft is retained.', 409)
    const previousBlocks = existing.timeBlocks as unknown as TimeBlock[]
    const existingBlockTasks = new Set(previousBlocks.map((block) => block.taskId))
    const newlyPlanned = [
      ...new Set([
        ...(input.focusTaskIds?.filter((id) => !existing.focusTaskIds.includes(id)) ?? []),
        ...(input.growthTaskId && input.growthTaskId !== existing.growthTaskId
          ? [input.growthTaskId]
          : []),
        ...blockIds.filter((id) => !existingBlockTasks.has(id)),
      ]),
    ]
    const tasks = await db.task.findMany({
      where: {
        userId: user.id,
        id: { in: newlyPlanned },
        status: { in: ['pending', 'in_progress'] },
      },
    })
    for (const task of tasks)
      if (task.plannedDate?.getTime() !== planDate.getTime()) {
        await db.task.update({ where: { id: task.id }, data: { plannedDate: planDate } })
        await db.taskPlanEvent.create({
          data: {
            userId: user.id,
            taskId: task.id,
            taskTitle: task.title,
            fromDate: task.plannedDate,
            toDate: planDate,
          },
        })
      }
    return NextResponse.json({ success: true, data: await readDayPlan(db, user.id, date) })
  })
}

/** Safe API envelopes preserve private planning content when validation or storage fails. */
export function plannerError(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}
/** Convert input errors to clear 400 responses and unexpected failures to retryable errors. */
export function plannerFailure(error: unknown) {
  return error instanceof ZodError
    ? plannerError('VALIDATION_ERROR', error.issues[0]?.message ?? 'Check this plan', 400)
    : plannerError(
        'INTERNAL_ERROR',
        'Could not save this plan. Your draft is kept; please retry.',
        500
      )
}
