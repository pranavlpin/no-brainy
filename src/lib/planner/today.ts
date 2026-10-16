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
  availableMinutes: number
  bufferMinutes: number
  workStart: string | null
  workEnd: string | null
  createdAt: string
  focusTasks: TaskResponse[]
  /** Tasks whose planned day is today, regardless of deadline. */
  plannedTasks: TaskResponse[]
  /** Tasks whose deadline is today. */
  tasksDueToday: TaskResponse[]
  /** Open tasks planned for or due on earlier days, plus yesterday's unfinished focus. */
  carryForward: TaskResponse[]
  goals: PlannerGoal[]
}

const DEFAULT_AVAILABLE_MINUTES = 180
const DEFAULT_BUFFER_MINUTES = 15

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
 * Assemble the full Today payload: the plan, focus tasks, tasks planned for
 * today, deadlines today, leftovers for triage, and active goals for chips.
 */
export async function buildTodayPayload(
  user: Pick<AuthUser, 'id'>,
  key: string,
  dayPlan: DayPlan
): Promise<TodayPayload> {
  const { start: today, end: nextDay } = dayBoundsUtc(key)
  const yesterday = dateFromKey(addDays(key, -1))

  // One query for the day: planned for today or due today.
  const dayTasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      OR: [{ plannedDate: { gte: today, lt: nextDay } }, { dueDate: { gte: today, lt: nextDay } }],
    },
    orderBy: [{ priorityRank: 'asc' }, { orderIndex: 'asc' }],
  })
  const isToday = (d: Date | null | undefined) => !!d && d >= today && d < nextDay
  const plannedTasks = dayTasks.filter((t) => isToday(t.plannedDate))
  const tasksDueToday = dayTasks.filter((t) => isToday(t.dueDate))

  // Leftovers: open tasks planned for an earlier day, or due yesterday.
  const leftoversDue = await prisma.task.findMany({
    where: {
      userId: user.id,
      status: OPEN_STATUSES,
      OR: [{ plannedDate: { lt: today } }, { dueDate: { gte: yesterday, lt: today } }],
    },
    orderBy: [{ plannedDate: 'asc' }, { orderIndex: 'asc' }],
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
    availableMinutes: dayPlan.availableMinutes ?? DEFAULT_AVAILABLE_MINUTES,
    bufferMinutes: dayPlan.bufferMinutes ?? DEFAULT_BUFFER_MINUTES,
    workStart: dayPlan.workStart ?? null,
    workEnd: dayPlan.workEnd ?? null,
    createdAt: dayPlan.createdAt.toISOString(),
    focusTasks: focusTasks.map(formatTask),
    plannedTasks: plannedTasks.map(formatTask),
    tasksDueToday: tasksDueToday.map(formatTask),
    carryForward: carryForward.map(formatTask),
    goals,
  }
}
