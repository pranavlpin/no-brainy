import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { formatTask } from '@/lib/tasks/format'
import { addDays, dateFromKey, keyFromDbDate, todayKey, userTimezone } from '@/lib/dates'

export const POST = withAuth(async (_req: NextRequest, user) => {
  try {
    const todayStr = todayKey(userTimezone(user))
    const today = dateFromKey(todayStr)
    const yesterday = dateFromKey(addDays(todayStr, -1))

    // Find yesterday's plan
    const yesterdayPlan = await prisma.dayPlan.findUnique({
      where: {
        userId_planDate: {
          userId: user.id,
          planDate: yesterday,
        },
      },
    })

    // Open tasks planned for an earlier day, or due yesterday
    const incompleteDueTasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        status: { notIn: ['completed', 'cancelled'] },
        OR: [{ plannedDate: { lt: today } }, { dueDate: { gte: yesterday, lt: today } }],
      },
      orderBy: { orderIndex: 'asc' },
    })

    // Also get incomplete focus tasks from yesterday's plan
    let incompleteFocusTasks: typeof incompleteDueTasks = []
    if (yesterdayPlan && yesterdayPlan.focusTaskIds.length > 0) {
      incompleteFocusTasks = await prisma.task.findMany({
        where: {
          id: { in: yesterdayPlan.focusTaskIds },
          userId: user.id,
          status: { notIn: ['completed', 'cancelled'] },
        },
      })
    }

    // Merge and deduplicate
    const taskMap = new Map<string, (typeof incompleteDueTasks)[number]>()
    for (const task of [...incompleteDueTasks, ...incompleteFocusTasks]) {
      taskMap.set(task.id, task)
    }

    const suggestions = Array.from(taskMap.values()).map(formatTask)

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        yesterdayDate: yesterday.toISOString(),
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
