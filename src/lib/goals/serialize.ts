import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { dateFromKey, localDayBounds, todayKey, weekBounds, addDays } from '@/lib/dates'
import { growthProgress, practiceDays } from '@/lib/growth/progress'
import type { GoalResponse } from '@/lib/types/goals'

/** Relations every goal read needs: tasks for progress, the latest measurement, the evidence count. */
export const goalInclude = {
  tasks: { select: { id: true, status: true } },
  expenseCategory: { select: { name: true } },
  evidence: {
    where: { measurement: { not: null } },
    orderBy: [{ observedAt: 'desc' as const }, { createdAt: 'desc' as const }],
    take: 1,
    select: { measurement: true, observedAt: true },
  },
  _count: { select: { evidence: true } },
} satisfies Prisma.GoalInclude

export type GoalRow = Prisma.GoalGetPayload<{ include: typeof goalInclude }>

/** The current local week as date keys plus the instants it spans. */
export function currentWeek(tz: string, now = new Date()) {
  const today = todayKey(tz, now)
  const { start, end } = weekBounds(today)
  return {
    today,
    weekStart: start,
    weekEnd: end,
    startInstant: localDayBounds(start, tz).start,
    endInstant: localDayBounds(end, tz).end,
  }
}

/** Practice days this week for many goals in two queries, keyed by goal id. */
export async function practiceCountsForGoals(
  userId: string,
  goalIds: string[],
  tz: string,
  now = new Date()
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (goalIds.length === 0) return counts
  const week = currentWeek(tz, now)
  const [evidence, sessions] = await Promise.all([
    prisma.growthEvidence.findMany({
      where: {
        userId,
        goalId: { in: goalIds },
        kind: 'practice',
        observedAt: { gte: dateFromKey(week.weekStart), lt: dateFromKey(addDays(week.weekEnd, 1)) },
      },
      select: { goalId: true, observedAt: true, kind: true },
    }),
    prisma.focusSession.findMany({
      where: {
        userId,
        kind: 'work',
        outcome: { in: ['completed', 'progress'] },
        endedAt: { gte: week.startInstant, lt: week.endInstant },
        task: { goalId: { in: goalIds } },
      },
      select: { endedAt: true, outcome: true, task: { select: { goalId: true } } },
    }),
  ])
  for (const id of goalIds) {
    counts.set(
      id,
      practiceDays({
        weekStart: week.weekStart,
        timezone: tz,
        sessions: sessions
          .filter((s) => s.task?.goalId === id)
          .map((s) => ({ endedAt: s.endedAt?.toISOString() ?? null, outcome: s.outcome })),
        evidence: evidence
          .filter((e) => e.goalId === id)
          .map((e) => ({ observedAt: e.observedAt.toISOString().slice(0, 10), kind: e.kind })),
      })
    )
  }
  return counts
}

async function financialProgress(goal: GoalRow) {
  if (goal.category !== 'financial' || !goal.targetAmount) {
    return { currentAmount: null, financialProgress: null }
  }
  const conditions: Prisma.ExpenseWhereInput[] = []
  if (goal.expenseCategoryId) conditions.push({ categoryId: goal.expenseCategoryId })
  if (goal.expenseTag) conditions.push({ tags: { has: goal.expenseTag } })
  if (conditions.length === 0) return { currentAmount: 0, financialProgress: 0 }
  const where: Prisma.ExpenseWhereInput = { userId: goal.userId, OR: conditions }
  if (goal.startDate || goal.targetDate) {
    where.date = {}
    if (goal.startDate) where.date.gte = goal.startDate
    if (goal.targetDate) where.date.lte = goal.targetDate
  }
  const result = await prisma.expense.aggregate({ where, _sum: { amount: true } })
  const currentAmount = result._sum.amount ? Number(result._sum.amount) : 0
  const target = Number(goal.targetAmount)
  return {
    currentAmount,
    financialProgress: target > 0 ? Math.round((currentAmount / target) * 100) : 0,
  }
}

/** API shape: amounts for financial goals, measured outcome and practice for the rest. */
export async function serializeGoal(goal: GoalRow, practiceCount: number): Promise<GoalResponse> {
  const taskCount = goal.tasks.filter((t) => t.status !== 'cancelled').length
  const completedTaskCount = goal.tasks.filter((t) => t.status === 'completed').length
  const latest = goal.evidence[0]
  const money = await financialProgress(goal)
  return {
    id: goal.id,
    userId: goal.userId,
    title: goal.title,
    description: goal.description,
    category: goal.category,
    targetDate: goal.targetDate?.toISOString() ?? null,
    startDate: goal.startDate?.toISOString() ?? null,
    expenseCategoryId: goal.expenseCategoryId ?? null,
    expenseCategoryName: goal.expenseCategory?.name ?? null,
    expenseTag: goal.expenseTag ?? null,
    targetAmount: goal.targetAmount ? Number(goal.targetAmount) : null,
    currentAmount: money.currentAmount,
    financialProgress: money.financialProgress,
    status: goal.status as GoalResponse['status'],
    successCriteria: goal.successCriteria ?? '',
    baseline: goal.baseline ?? null,
    target: goal.target ?? null,
    unit: goal.unit ?? null,
    weeklyPracticeTarget: goal.weeklyPracticeTarget ?? null,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
    taskCount,
    completedTaskCount,
    ...growthProgress({ ...goal, taskCount, completedTaskCount }, latest?.measurement ?? null),
    measurementDate: latest ? latest.observedAt.toISOString().slice(0, 10) : null,
    practiceCount,
    evidenceCount: goal._count.evidence,
  }
}

/** Parse optional calendar fields for writes. */
export function goalWriteData<
  T extends { targetDate?: string | null; startDate?: string | null; targetAmount?: number | null },
>(input: T) {
  const { targetDate, startDate, ...rest } = input
  return {
    ...rest,
    ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : null }),
    ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
  }
}
