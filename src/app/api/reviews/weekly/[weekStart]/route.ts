import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import type { Prisma, WeeklyReview } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { dateFromKey } from '@/lib/dates'
import { nextWeekStart, weekEndFor } from '@/lib/reviews/weeks'
import { weekStartParamSchema, weeklyReviewSchema } from '@/lib/validations/reviews'
import type { WeeklyOutcome, WeeklyReviewResponse } from '@/lib/types/reviews'

type Row = WeeklyReview & {
  nextTask: { id: string; title: string; plannedDate: Date | null; status: string } | null
}

const include = {
  nextTask: { select: { id: true, title: true, plannedDate: true, status: true } },
} satisfies Prisma.WeeklyReviewInclude

class WeeklyError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message)
  }
}

function serialize(row: Row): WeeklyReviewResponse {
  const weekStart = row.weekStart.toISOString().slice(0, 10)
  return {
    id: row.id,
    userId: row.userId,
    weekStart,
    weekEnd: weekEndFor(weekStart),
    stopDoing: row.stopDoing,
    keepDoing: row.keepDoing,
    startTrying: row.startTrying,
    reflectionMd: row.reflectionMd,
    outcomes: (Array.isArray(row.outcomes) ? row.outcomes : []) as unknown as WeeklyOutcome[],
    nextTaskId: row.nextTaskId,
    nextTask: row.nextTask
      ? {
          id: row.nextTask.id,
          title: row.nextTask.title,
          plannedDate: row.nextTask.plannedDate?.toISOString().slice(0, 10) ?? null,
          status: row.nextTask.status,
        }
      : null,
    closedAt: row.closedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function weekKey(req: NextRequest): string {
  const raw = req.nextUrl.pathname.split('/').pop()!
  const parsed = weekStartParamSchema.safeParse(raw)
  if (!parsed.success) {
    throw new WeeklyError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Use a Monday date key')
  }
  return parsed.data
}

function failure(error: unknown) {
  if (error instanceof WeeklyError) {
    return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status })
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message ?? 'Invalid input' } },
      { status: 400 }
    )
  }
  console.error('[reviews/weekly]', error)
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    { status: 500 }
  )
}

/** Read the week's adjustment, creating it on first visit. */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const key = weekKey(req)
    const row = await prisma.weeklyReview.upsert({
      where: { userId_weekStart: { userId: user.id, weekStart: dateFromKey(key) } },
      update: {},
      create: { userId: user.id, weekStart: dateFromKey(key) },
      include,
    })
    return NextResponse.json({ success: true, data: serialize(row) })
  } catch (error) {
    return failure(error)
  }
})

/**
 * Save the adjustment. The chosen next action is planned onto the following
 * Monday (its deadline is untouched). A stale version is a conflict.
 */
export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const key = weekKey(req)
    const { expectedUpdatedAt, closeReview, ...input } = weeklyReviewSchema.parse(await req.json())
    const result = await prisma.$transaction(async (db) => {
      const current = await db.weeklyReview.upsert({
        where: { userId_weekStart: { userId: user.id, weekStart: dateFromKey(key) } },
        update: {},
        create: { userId: user.id, weekStart: dateFromKey(key) },
        include,
      })
      if (expectedUpdatedAt && current.updatedAt.getTime() !== new Date(expectedUpdatedAt).getTime()) {
        throw new WeeklyError(409, 'CONFLICT', 'This weekly review changed elsewhere. Choose which version to keep.')
      }
      if (input.nextTaskId && input.nextTaskId !== current.nextTaskId) {
        const task = await db.task.findFirst({
          where: { id: input.nextTaskId, userId: user.id, status: { in: ['pending', 'in_progress'] } },
        })
        if (!task) throw new WeeklyError(400, 'VALIDATION_ERROR', 'Choose an open task from your own workspace')
        const monday = nextWeekStart(key)
        if (task.plannedDate?.toISOString().slice(0, 10) !== monday) {
          await db.task.update({ where: { id: task.id }, data: { plannedDate: dateFromKey(monday) } })
        }
      }
      const data: Prisma.WeeklyReviewUncheckedUpdateInput = {
        ...(input.stopDoing !== undefined && { stopDoing: input.stopDoing }),
        ...(input.keepDoing !== undefined && { keepDoing: input.keepDoing }),
        ...(input.startTrying !== undefined && { startTrying: input.startTrying }),
        ...(input.reflectionMd !== undefined && { reflectionMd: input.reflectionMd }),
        ...(input.outcomes !== undefined && { outcomes: input.outcomes as unknown as Prisma.InputJsonValue }),
        ...(input.nextTaskId !== undefined && { nextTaskId: input.nextTaskId }),
        ...(closeReview !== undefined && { closedAt: closeReview ? (current.closedAt ?? new Date()) : null }),
        updatedAt: new Date(Math.max(Date.now(), current.updatedAt.getTime() + 1)),
      }
      return db.weeklyReview.update({ where: { id: current.id }, data, include })
    })
    return NextResponse.json({ success: true, data: serialize(result as Row) })
  } catch (error) {
    return failure(error)
  }
})
