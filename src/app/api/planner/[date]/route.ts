import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { personalSettings } from '@/lib/settings/personal'
import { dateParamSchema } from '@/lib/validations/planner'
import type { TimeBlock } from '@/lib/types/planner'
import { formatTask } from '@/lib/tasks/format'

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    // Extract date from URL path: /api/planner/YYYY-MM-DD
    const segments = req.nextUrl.pathname.split('/')
    const dateStr = segments[segments.length - 1]

    const parsed = dateParamSchema.safeParse(dateStr)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Date must be in YYYY-MM-DD format' },
        },
        { status: 400 }
      )
    }

    const planDate = new Date(parsed.data + 'T00:00:00.000Z')

    const dayPlan = await prisma.dayPlan.findUnique({
      where: {
        userId_planDate: {
          userId: user.id,
          planDate,
        },
      },
    })

    // Fetch tasks due on that date
    const nextDay = new Date(planDate)
    nextDay.setDate(nextDay.getDate() + 1)

    const tasksDueOnDate = await prisma.task.findMany({
      where: {
        userId: user.id,
        dueDate: { gte: planDate, lt: nextDay },
      },
      orderBy: { orderIndex: 'asc' },
    })

    if (!dayPlan) {
      // A day without a plan yet shows the same defaults today would be created with.
      const defaults = personalSettings(user.timezone ?? 'UTC', user.preferences)
      return NextResponse.json({
        success: true,
        data: {
          id: null,
          userId: user.id,
          planDate: planDate.toISOString(),
          focusTaskIds: [],
          timeBlocks: [],
          aiBriefMd: null,
          intentMd: null,
          availableMinutes: defaults.availableMinutes,
          bufferMinutes: defaults.bufferMinutes,
          workStart: defaults.workStart,
          workEnd: defaults.workEnd,
          createdAt: null,
          focusTasks: [],
          tasksDueOnDate: tasksDueOnDate.map(formatTask),
        },
      })
    }

    // Fetch focus tasks
    const focusTasks =
      dayPlan.focusTaskIds.length > 0
        ? await prisma.task.findMany({
            where: {
              id: { in: dayPlan.focusTaskIds },
              userId: user.id,
            },
          })
        : []

    return NextResponse.json({
      success: true,
      data: {
        id: dayPlan.id,
        userId: dayPlan.userId,
        planDate: dayPlan.planDate.toISOString(),
        focusTaskIds: dayPlan.focusTaskIds,
        timeBlocks: dayPlan.timeBlocks as unknown as TimeBlock[],
        aiBriefMd: dayPlan.aiBriefMd,
        intentMd: dayPlan.intentMd ?? null,
        availableMinutes: dayPlan.availableMinutes,
        bufferMinutes: dayPlan.bufferMinutes,
        workStart: dayPlan.workStart ?? null,
        workEnd: dayPlan.workEnd ?? null,
        createdAt: dayPlan.createdAt.toISOString(),
        focusTasks: focusTasks.map(formatTask),
        tasksDueOnDate: tasksDueOnDate.map(formatTask),
      },
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})
