import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import type { Prisma, DailyReview, WeeklyReview } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { AuthUser } from '@/lib/types/auth'
import { serializeTask } from '@/lib/tasks/serialize'
import { addCalendarDays, todayInTimezone } from '@/lib/dates/calendar'
import { calendarWindow } from './calendar-window'
import {
  reviewDateSchema,
  weekDateSchema,
  updateReviewSchema,
  weeklyReviewSchema,
} from '@/lib/validations/reviews'

/** Safe review errors distinguish stale writes and invalid relationships without exposing private content. */
export class ReviewError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
  }
}
/** Keep input failures actionable and unexpected persistence failures private. */
export function reviewFailure(error: unknown) {
  const status = error instanceof ReviewError ? error.status : error instanceof ZodError ? 400 : 500
  return NextResponse.json(
    {
      success: false,
      error: {
        code: status === 409 ? 'CONFLICT' : 'REVIEW_ERROR',
        message:
          error instanceof ReviewError
            ? error.message
            : error instanceof ZodError
              ? error.issues[0].message
              : 'Could not save this review. Your draft is kept; please retry.',
      },
    },
    { status }
  )
}
/** Render calendar labels and version instants without rewriting legacy reflection text. */
export function serializeDaily(review: DailyReview) {
  return {
    ...review,
    reviewDate: review.reviewDate.toISOString().slice(0, 10),
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    closedAt: review.closedAt?.toISOString() ?? null,
  }
}
/** Render a saved weekly adjustment; outcome identities remain stable while their text changes. */
export function serializeWeekly(review: WeeklyReview) {
  return {
    ...review,
    weekStart: review.weekStart.toISOString().slice(0, 10),
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    closedAt: review.closedAt?.toISOString() ?? null,
  }
}
/** Derive live bounded activity without changing the reflection's version or stored historical text. */
export async function reviewActivity(user: AuthUser, date: string, days = 1) {
  const range = calendarWindow(date, user.timezone, days)
  const endDate = addCalendarDays(date, days)
  const [completedTasks, unfinishedTasks, focusSessions, notesCreated, cards] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId: user.id,
        status: 'completed',
        completedAt: { gte: range.start, lt: range.end },
      },
      orderBy: [{ completedAt: 'desc' }, { id: 'asc' }],
    }),
    prisma.task.findMany({
      where: {
        userId: user.id,
        status: { in: ['pending', 'in_progress'] },
        routinePaused: false,
        AND: [
          { OR: [{ goalId: null }, { goal: { status: 'active' } }] },
          {
            OR: [
              { plannedDate: { gte: new Date(date), lt: new Date(endDate) } },
              { dueDate: { gte: new Date(date), lt: new Date(endDate) } },
            ],
          },
        ],
      },
      orderBy: [{ plannedDate: 'asc' }, { id: 'asc' }],
    }),
    prisma.focusSession.findMany({
      where: {
        userId: user.id,
        state: 'finished',
        completedAt: { gte: range.start, lt: range.end },
      },
      orderBy: [{ completedAt: 'desc' }, { id: 'asc' }],
    }),
    prisma.note.count({
      where: { userId: user.id, isDeleted: false, createdAt: { gte: range.start, lt: range.end } },
    }),
    prisma.reviewSession.aggregate({
      where: { userId: user.id, startedAt: { gte: range.start, lt: range.end } },
      _sum: { cardsReviewed: true },
    }),
  ])
  return {
    tasksCompleted: completedTasks.length,
    tasksMissed: unfinishedTasks.length,
    notesCreated,
    cardsReviewed: cards._sum.cardsReviewed ?? 0,
    completedTasks: completedTasks.map(serializeTask),
    unfinishedTasks: unfinishedTasks.map(serializeTask),
    focusSessions,
    focusSeconds: focusSessions.reduce((sum, item) => sum + item.accumulatedSeconds, 0),
  }
}
function validateDay(user: AuthUser, date: string, weekly = false) {
  ;(weekly ? weekDateSchema : reviewDateSchema).parse(date)
  if (date > todayInTimezone(user.timezone))
    throw new ReviewError(400, 'Choose today or an earlier review date')
}
/** Read/create the requested draft while calculating day activity in the account timezone. */
export async function readDaily(user: AuthUser, date: string) {
  validateDay(user, date)
  const review = await prisma.dailyReview.upsert({
    where: { userId_reviewDate: { userId: user.id, reviewDate: new Date(date) } },
    update: {},
    create: { userId: user.id, reviewDate: new Date(date) },
  })
  const activity = await reviewActivity(user, date)
  return {
    ...serializeDaily(review),
    tasksCompleted: activity.tasksCompleted,
    tasksMissed: activity.tasksMissed,
    notesCreated: activity.notesCreated,
    cardsReviewed: activity.cardsReviewed,
    activity,
    today: todayInTimezone(user.timezone),
    timezone: user.timezone,
  }
}
/** Read/create a Monday-keyed weekly adjustment without auto-changing its selected week. */
export async function readWeekly(user: AuthUser, date: string) {
  validateDay(user, date, true)
  const review = await prisma.weeklyReview.upsert({
    where: { userId_weekStart: { userId: user.id, weekStart: new Date(date) } },
    update: {},
    create: { userId: user.id, weekStart: new Date(date) },
  })
  return {
    ...serializeWeekly(review),
    activity: await reviewActivity(user, date, 7),
    today: todayInTimezone(user.timezone),
    timezone: user.timezone,
  }
}
function alreadyApplied(
  existing: Record<string, unknown>,
  patch: Record<string, unknown>,
  close: boolean | undefined
) {
  return (
    Object.entries(patch).every(
      ([key, value]) => JSON.stringify(existing[key]) === JSON.stringify(value)
    ) &&
    (close === undefined || !!existing.closedAt === close)
  )
}
async function schedule(
  db: Prisma.TransactionClient,
  userId: string,
  id: string | null | undefined,
  oldId: string | null,
  date: string
) {
  if (!id || id === oldId) return
  const task = await db.task.findFirst({
    where: { id, userId, status: { in: ['pending', 'in_progress'] } },
  })
  if (!task) throw new ReviewError(400, 'Choose an active action from your own workspace')
  if (task.plannedDate?.toISOString().slice(0, 10) === date) return
  const plannedDate = new Date(date)
  await db.task.update({ where: { id }, data: { plannedDate } })
  await db.taskPlanEvent.create({
    data: {
      userId,
      taskId: id,
      taskTitle: task.title,
      fromDate: task.plannedDate,
      toDate: plannedDate,
    },
  })
}
/** Save structured answers and an explicitly selected tomorrow action atomically; repeated identical writes are safe. */
export async function saveDaily(user: AuthUser, date: string, body: unknown) {
  validateDay(user, date)
  const { expectedUpdatedAt, closeReview, ...input } = updateReviewSchema.parse(body)
  await prisma.$transaction(async (db) => {
    await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
    const current = await db.dailyReview.upsert({
      where: { userId_reviewDate: { userId: user.id, reviewDate: new Date(date) } },
      update: {},
      create: { userId: user.id, reviewDate: new Date(date) },
    })
    if (expectedUpdatedAt && current.updatedAt.toISOString() !== expectedUpdatedAt) {
      if (alreadyApplied(current, input, closeReview)) return
      throw new ReviewError(
        409,
        'This review changed elsewhere. Your draft is kept; choose which version to keep.'
      )
    }
    await schedule(
      db,
      user.id,
      input.tomorrowTaskId,
      current.tomorrowTaskId,
      addCalendarDays(date, 1)
    )
    await db.dailyReview.update({
      where: { id: current.id },
      data: {
        ...input,
        ...(closeReview !== undefined && {
          closedAt: closeReview ? (current.closedAt ?? new Date()) : null,
        }),
        updatedAt: new Date(Math.max(Date.now(), current.updatedAt.getTime() + 1)),
      },
    })
  })
  return readDaily(user, date)
}
/** Save one weekly adjustment and its deliberate next-Monday action in the same transaction. */
export async function saveWeekly(user: AuthUser, date: string, body: unknown) {
  validateDay(user, date, true)
  const { expectedUpdatedAt, closeReview, ...input } = weeklyReviewSchema.parse(body)
  await prisma.$transaction(async (db) => {
    await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
    const current = await db.weeklyReview.upsert({
      where: { userId_weekStart: { userId: user.id, weekStart: new Date(date) } },
      update: {},
      create: { userId: user.id, weekStart: new Date(date) },
    })
    if (expectedUpdatedAt && current.updatedAt.toISOString() !== expectedUpdatedAt) {
      if (alreadyApplied(current, input, closeReview)) return
      throw new ReviewError(
        409,
        'This weekly review changed elsewhere. Your draft is kept; choose which version to keep.'
      )
    }
    await schedule(db, user.id, input.nextTaskId, current.nextTaskId, addCalendarDays(date, 7))
    await db.weeklyReview.update({
      where: { id: current.id },
      data: {
        ...input,
        ...(closeReview !== undefined && {
          closedAt: closeReview ? (current.closedAt ?? new Date()) : null,
        }),
        updatedAt: new Date(Math.max(Date.now(), current.updatedAt.getTime() + 1)),
      },
    })
  })
  return readWeekly(user, date)
}
