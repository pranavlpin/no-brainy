import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import type { DayPlan, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { updateDayPlanSchema } from '@/lib/validations/planner'
import { addDays, dateFromKey, dayBoundsUtc, todayKey, userTimezone } from '@/lib/dates'
import { formatTask } from '@/lib/tasks/format'
import type { AuthUser } from '@/lib/types/auth'
import type { TimeBlock } from '@/lib/types/planner'

const OPEN_STATUSES: Prisma.StringFilter = { notIn: ['completed', 'cancelled'] }

/**
 * Assemble the full Today payload: the plan, focus tasks, tasks due today,
 * yesterday's leftovers for triage, and active goals for chips.
 */
async function buildTodayPayload(user: AuthUser, key: string, dayPlan: DayPlan) {
  const { start: today, end: nextDay } = dayBoundsUtc(key)
  const yesterdayKey = addDays(key, -1)
  const yesterday = dateFromKey(yesterdayKey)

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
  // Preserve the user's slot order.
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

async function getOrCreatePlan(user: AuthUser, key: string): Promise<DayPlan> {
  const planDate = dateFromKey(key)
  const existing = await prisma.dayPlan.findUnique({
    where: { userId_planDate: { userId: user.id, planDate } },
  })
  if (existing) return existing
  return prisma.dayPlan.create({
    data: { userId: user.id, planDate, focusTaskIds: [], timeBlocks: [] },
  })
}

function internalError() {
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    { status: 500 }
  )
}

export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    const key = todayKey(userTimezone(user))
    const dayPlan = await getOrCreatePlan(user, key)
    return NextResponse.json({ success: true, data: await buildTodayPayload(user, key, dayPlan) })
  } catch (error) {
    console.error('[planner/today GET]', error)
    return internalError()
  }
})

export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const data = updateDayPlanSchema.parse(await req.json())
    const key = todayKey(userTimezone(user))
    const planDate = dateFromKey(key)

    if (data.focusTaskIds && data.focusTaskIds.length > 0) {
      const validTasks = await prisma.task.count({
        where: { id: { in: data.focusTaskIds }, userId: user.id },
      })
      if (validTasks !== data.focusTaskIds.length) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'One or more focus task IDs are invalid' },
          },
          { status: 400 }
        )
      }
    }

    const dayPlan = await prisma.dayPlan.upsert({
      where: { userId_planDate: { userId: user.id, planDate } },
      update: {
        ...(data.focusTaskIds !== undefined && { focusTaskIds: data.focusTaskIds }),
        ...(data.timeBlocks !== undefined && {
          timeBlocks: data.timeBlocks as unknown as Prisma.InputJsonValue,
        }),
        ...(data.aiBriefMd !== undefined && { aiBriefMd: data.aiBriefMd }),
        ...(data.intentMd !== undefined && { intentMd: data.intentMd }),
      },
      create: {
        userId: user.id,
        planDate,
        focusTaskIds: data.focusTaskIds ?? [],
        timeBlocks: (data.timeBlocks ?? []) as unknown as Prisma.InputJsonValue,
        aiBriefMd: data.aiBriefMd ?? null,
        intentMd: data.intentMd ?? null,
      },
    })

    return NextResponse.json({ success: true, data: await buildTodayPayload(user, key, dayPlan) })
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
    console.error('[planner/today PUT]', error)
    return internalError()
  }
})
