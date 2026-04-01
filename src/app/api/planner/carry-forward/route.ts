import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import type { TaskResponse } from '@/lib/types/tasks'

function formatTask(task: {
  id: string
  userId: string
  parentTaskId: string | null
  goalId: string | null
  title: string
  descriptionMd: string
  priority: string
  status: string
  tags: string[]
  dueDate: Date | null
  completedAt: Date | null
  isRecurring: boolean
  rrule: string | null
  quadrant: string | null
  orderIndex: number
  createdAt: Date
  updatedAt: Date
}): TaskResponse {
  return {
    id: task.id,
    userId: task.userId,
    parentTaskId: task.parentTaskId,
    goalId: task.goalId,
    title: task.title,
    descriptionMd: task.descriptionMd,
    priority: task.priority as TaskResponse['priority'],
    status: task.status as TaskResponse['status'],
    tags: task.tags,
    dueDate: task.dueDate?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    isRecurring: task.isRecurring,
    rrule: task.rrule,
    quadrant: task.quadrant as TaskResponse['quadrant'],
    orderIndex: task.orderIndex,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }
}

export const POST = withAuth(async (_req: NextRequest, user) => {
  try {
    const now = new Date()
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Find yesterday's plan
    const yesterdayPlan = await prisma.dayPlan.findUnique({
      where: {
        userId_planDate: {
          userId: user.id,
          planDate: yesterday,
        },
      },
    })

    // Get tasks due yesterday that are not completed
    const yesterdayEnd = new Date(today)
    const incompleteDueTasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        dueDate: { gte: yesterday, lt: yesterdayEnd },
        status: { notIn: ['completed', 'cancelled'] },
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
