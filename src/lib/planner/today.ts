import type { DayPlan, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { addDays, dateFromKey, dayBoundsUtc } from '@/lib/dates'
import { formatTask } from '@/lib/tasks/format'
import type { AuthUser } from '@/lib/types/auth'
import type { PlannerGoal, TimeBlock } from '@/lib/types/planner'
import type { TaskResponse } from '@/lib/types/tasks'

const OPEN_STATUSES: Prisma.StringFilter = { notIn: ['completed', 'cancelled'] }

export interface TodayPayload {
  id: string
  userId: string
  planDate: string
  focusTaskIds: string[]
  timeBlocks: TimeBlock[]
  aiBriefMd: string | null
  intentMd: string | null
  createdAt: string
  focusTasks: TaskResponse[]
  tasksDueToday: TaskResponse[]
  carryForward: TaskResponse[]
  goals: PlannerGoal[]
}

/** Find today's plan or create it, seeding the intent from last night's review. */
export async function getOrCreatePlan(user: Pick<AuthUser, 'id'>, key: string): Promise<DayPlan> {
  const planDate = dateFromKey(key)
  const existing = await prisma.dayPlan.findUnique({
    where: { userId_planDate: { userId: user.id, planDate } },
  })
  if (existing) return existing
  const yesterdayReview = await prisma.dailyReview.findUnique({
    where: { userId_reviewDate: { userId: user.id, reviewDate: dateFromKey(addDays(key, -1)) } },
    select: { tomorrowIntent: true },
  })
  const intentMd = yesterdayReview?.tomorrowIntent?.trim() || null
  return prisma.dayPlan.create({
    data: { userId: user.id, planDate, focusTaskIds: [], timeBlocks: [], intentMd },
  })
}

/**
 * Assemble the full Today payload: the plan, focus tasks, tasks due today,
 * yesterday's leftovers for triage, and active goals for chips.
 */
export async function buildTodayPayload(
  user: Pick<AuthUser, 'id'>,
  key: string,
  dayPlan: DayPlan
): Promise<TodayPayload> {
  const { start: today, end: nextDay } = dayBoundsUtc(key)
  const yesterday = dateFromKey(addDays(key, -1))

  const tasksDueToday = await prisma.task.findMany({
    where: { userId: user.id, dueDate: { gte: today, lt: nextDay } },
    orderBy: { orderIndex: 'asc' },
  })

  const leftoversDue = await prisma.task.findMany({
    where: { userId: user.id, dueDate: { gte: yesterday, lt: today }, status: OPEN_STATUSES },
    orderBy: { orderIndex: 'asc' },
  })

  const yesterdayPlan = await prisma.dayPlan.findUnique({
    where: { userId_planDate: { userId: user.id, planDate: yesterday } },
  })
  const leftoverFocusIds = (yesterdayPlan?.focusTaskIds ?? []).filter(
    (id) => !leftoversDue.some((t) => t.id === id) && !dayPlan.focusTaskIds.includes(id)
  )
  const leftoverFocus =
    leftoverFocusIds.length > 0
      ? await prisma.task.findMany({
          where: { id: { in: leftoverFocusIds }, userId: user.id, status: OPEN_STATUSES },
        })
      : []

  const focusTasks =
    dayPlan.focusTaskIds.length > 0
      ? await prisma.task.findMany({ where: { id: { in: dayPlan.focusTaskIds }, userId: user.id } })
      : []
  focusTasks.sort((a, b) => dayPlan.focusTaskIds.indexOf(a.id) - dayPlan.focusTaskIds.indexOf(b.id))

  const goals = await prisma.goal.findMany({
    where: { userId: user.id, status: 'active' },
    select: { id: true, title: true, category: true },
    orderBy: { updatedAt: 'desc' },
  })

  const carryForward = [...leftoversDue, ...leftoverFocus].filter(
    (t) => !dayPlan.focusTaskIds.includes(t.id)
  )

  return {
    id: dayPlan.id,
    userId: dayPlan.userId,
    planDate: dayPlan.planDate.toISOString(),
    focusTaskIds: dayPlan.focusTaskIds,
    timeBlocks: dayPlan.timeBlocks as unknown as TimeBlock[],
    aiBriefMd: dayPlan.aiBriefMd,
    intentMd: dayPlan.intentMd ?? null,
    createdAt: dayPlan.createdAt.toISOString(),
    focusTasks: focusTasks.map(formatTask),
    tasksDueToday: tasksDueToday.map(formatTask),
    carryForward: carryForward.map(formatTask),
    goals,
  }
}
