import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma, type Goal } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { growthProgress, practiceIdentity, type PracticeTask } from './progress'
import { todayInTimezone } from '@/lib/dates/calendar'

/** A safe validation/ownership error; never includes private source contents. */
export class GrowthError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
  }
}
/** Translate failures into a retryable API envelope without leaking source data. */
export function growthFailure(error: unknown) {
  const status = error instanceof GrowthError ? error.status : error instanceof ZodError ? 400 : 500
  return NextResponse.json(
    {
      success: false,
      error: {
        code: status === 409 ? 'CONFLICT' : 'GROWTH_ERROR',
        message:
          error instanceof GrowthError
            ? error.message
            : error instanceof ZodError
              ? error.issues[0].message
              : 'Could not save this change. Your input is kept; please retry.',
      },
    },
    { status }
  )
}
export const goalInclude = Prisma.validator<Prisma.GoalInclude>()({
  tasks: { select: { status: true } },
  expenseCategory: { select: { name: true } },
  evidence: {
    where: { measurement: { not: null } },
    orderBy: [{ observedAt: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
    take: 1,
  },
})
type IncludedGoal = Prisma.GoalGetPayload<{ include: typeof goalInclude }>
/** Preserve the existing financial amount contract while exposing separate action and outcome metrics. */
export async function serializeGoal(goal: IncludedGoal) {
  let currentAmount: number | null = null
  let financialProgress: number | null = null
  if (goal.category === 'financial' && goal.targetAmount) {
    const conditions: Prisma.ExpenseWhereInput[] = []
    if (goal.expenseCategoryId) conditions.push({ categoryId: goal.expenseCategoryId })
    if (goal.expenseTag) conditions.push({ tags: { has: goal.expenseTag } })
    const result = conditions.length
      ? await prisma.expense.aggregate({
          where: {
            userId: goal.userId,
            OR: conditions,
            ...((goal.startDate || goal.targetDate) && {
              date: {
                ...(goal.startDate && { gte: goal.startDate }),
                ...(goal.targetDate && { lte: goal.targetDate }),
              },
            }),
          },
          _sum: { amount: true },
        })
      : null
    currentAmount = Number(result?._sum.amount ?? 0)
    financialProgress = Math.round((currentAmount / Number(goal.targetAmount)) * 100)
  }
  const taskCount = goal.tasks.filter((t) => t.status !== 'cancelled').length
  const completedTaskCount = goal.tasks.filter((t) => t.status === 'completed').length
  const { tasks: _tasks, evidence: _evidence, expenseCategory, ...fields } = goal
  return {
    ...fields,
    targetDate: goal.targetDate?.toISOString() ?? null,
    startDate: goal.startDate?.toISOString() ?? null,
    targetAmount: goal.targetAmount ? Number(goal.targetAmount) : null,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
    expenseCategoryName: expenseCategory?.name ?? null,
    taskCount,
    completedTaskCount,
    currentAmount,
    financialProgress,
    ...growthProgress(
      { ...goal, taskCount, completedTaskCount },
      goal.evidence[0]?.measurement ?? null
    ),
    measurementDate: goal.evidence[0]?.observedAt.toISOString().slice(0, 10) ?? null,
  }
}
/** Validate the optional financial relation against the authenticated owner. */
export async function checkExpenseCategory(userId: string, id: string | null | undefined) {
  if (
    id &&
    !(await prisma.expenseCategory.findFirst({ where: { id, userId }, select: { id: true } }))
  )
    throw new GrowthError(400, 'Choose a category from your workspace')
}
export interface GrowthSource {
  id: string
  title: string
  href: string
  content: string
  practiceKey: string | null
  observedAt?: string
}
type GrowthDb = Prisma.TransactionClient
/** Resolve an explicitly chosen owned source; no external fetch or AI call is made. */
export async function ownedGrowthSource(
  db: GrowthDb,
  userId: string,
  type: string,
  id: string,
  timezone = 'UTC'
): Promise<GrowthSource> {
  if (type === 'note') {
    const item = await db.note.findFirst({ where: { id, userId, isDeleted: false } })
    if (item)
      return {
        id,
        title: item.title,
        href: `/notes/${id}`,
        content: item.contentMd,
        practiceKey: null,
      }
  }
  if (type === 'book') {
    const item = await db.book.findFirst({ where: { id, userId } })
    if (item)
      return {
        id,
        title: item.title,
        href: `/books/${id}`,
        content: item.applicationMd,
        practiceKey: null,
      }
  }
  if (type === 'project') {
    const item = await db.project.findFirst({ where: { id, userId } })
    if (item)
      return {
        id,
        title: item.title,
        href: `/projects/${id}`,
        content: item.outcome,
        practiceKey: null,
      }
  }
  if (type === 'session') {
    const item = await db.focusSession.findFirst({
      where: { id, userId, state: 'finished' },
      include: { task: true },
    })
    if (item)
      return {
        id,
        title: item.taskTitle,
        href: `/reviews/daily?date=${todayInTimezone(timezone, item.completedAt!)}`,
        content: item.reflection,
        observedAt: todayInTimezone(timezone, item.completedAt!),
        practiceKey: practiceIdentity(item.task ? practiceTask(item.task) : null, item.id),
      }
  }
  throw new GrowthError(400, 'Choose a source from your own workspace')
}
/** Project the database's date fields to the canonical practice representation. */
export function practiceTask(task: {
  id: string
  routineId: string | null
  occurrenceDate: Date | null
  completedAt: Date | null
  status: string
}): PracticeTask {
  return {
    ...task,
    occurrenceDate: task.occurrenceDate?.toISOString().slice(0, 10) ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
  }
}
/** Parse optional goal fields for database writes while keeping calendar dates distinct. */
export function goalDates<T extends { targetDate?: string | null; startDate?: string | null }>(
  input: T
) {
  const { targetDate, startDate, ...fields } = input
  return {
    ...fields,
    ...(targetDate !== undefined && {
      targetDate: targetDate ? new Date(`${targetDate}T00:00:00Z`) : null,
    }),
    ...(startDate !== undefined && {
      startDate: startDate ? new Date(`${startDate}T00:00:00Z`) : null,
    }),
  }
}
/** Goal activity is explicit; completion of its tasks never changes the goal status. */
export function needsPractice(goal: Pick<Goal, 'status' | 'weeklyPracticeTarget'>, count: number) {
  return (
    goal.status === 'active' &&
    goal.weeklyPracticeTarget !== null &&
    count < goal.weeklyPracticeTarget
  )
}

/** Evidence keeps a readable source snapshot even when its original source is later removed. */
export async function serializeEvidence(
  item: import('@prisma/client').GrowthEvidence,
  timezone: string
) {
  let sourceHref: string | null = null
  if (item.sourceType && item.sourceId) {
    try {
      sourceHref = (
        await ownedGrowthSource(prisma, item.userId, item.sourceType, item.sourceId, timezone)
      ).href
    } catch (error) {
      if (!(error instanceof GrowthError)) throw error
    }
  }
  return {
    ...item,
    observedAt: item.observedAt.toISOString().slice(0, 10),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    sourceHref,
  }
}
