import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { updateDayPlanSchema } from '@/lib/validations/planner'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'
import type { TimeBlock } from '@/lib/types/planner'
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

function getTodayDate(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    const today = getTodayDate()

    let dayPlan = await prisma.dayPlan.findUnique({
      where: {
        userId_planDate: {
          userId: user.id,
          planDate: today,
        },
      },
    })

    if (!dayPlan) {
      dayPlan = await prisma.dayPlan.create({
        data: {
          userId: user.id,
          planDate: today,
          focusTaskIds: [],
          timeBlocks: [],
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

    // Fetch tasks due today
    const nextDay = new Date(today)
    nextDay.setDate(nextDay.getDate() + 1)

    const tasksDueToday = await prisma.task.findMany({
      where: {
        userId: user.id,
        dueDate: { gte: today, lt: nextDay },
      },
      orderBy: { orderIndex: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: dayPlan.id,
        userId: dayPlan.userId,
        planDate: dayPlan.planDate.toISOString(),
        focusTaskIds: dayPlan.focusTaskIds,
        timeBlocks: dayPlan.timeBlocks as unknown as TimeBlock[],
        aiBriefMd: dayPlan.aiBriefMd,
        createdAt: dayPlan.createdAt.toISOString(),
        focusTasks: focusTasks.map(formatTask),
        tasksDueToday: tasksDueToday.map(formatTask),
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

export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const data = updateDayPlanSchema.parse(body)
    const today = getTodayDate()

    // Validate that focus task IDs belong to the user
    if (data.focusTaskIds && data.focusTaskIds.length > 0) {
      const validTasks = await prisma.task.count({
        where: {
          id: { in: data.focusTaskIds },
          userId: user.id,
        },
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
      where: {
        userId_planDate: {
          userId: user.id,
          planDate: today,
        },
      },
      update: {
        ...(data.focusTaskIds !== undefined && { focusTaskIds: data.focusTaskIds }),
        ...(data.timeBlocks !== undefined && { timeBlocks: data.timeBlocks as Prisma.InputJsonValue }),
        ...(data.aiBriefMd !== undefined && { aiBriefMd: data.aiBriefMd }),
      },
      create: {
        userId: user.id,
        planDate: today,
        focusTaskIds: data.focusTaskIds ?? [],
        timeBlocks: (data.timeBlocks ?? []) as Prisma.InputJsonValue,
        aiBriefMd: data.aiBriefMd ?? null,
      },
    })

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

    // Fetch tasks due today
    const nextDay = new Date(today)
    nextDay.setDate(nextDay.getDate() + 1)

    const tasksDueToday = await prisma.task.findMany({
      where: {
        userId: user.id,
        dueDate: { gte: today, lt: nextDay },
      },
      orderBy: { orderIndex: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: dayPlan.id,
        userId: dayPlan.userId,
        planDate: dayPlan.planDate.toISOString(),
        focusTaskIds: dayPlan.focusTaskIds,
        timeBlocks: dayPlan.timeBlocks as unknown as TimeBlock[],
        aiBriefMd: dayPlan.aiBriefMd,
        createdAt: dayPlan.createdAt.toISOString(),
        focusTasks: focusTasks.map(formatTask),
        tasksDueToday: tasksDueToday.map(formatTask),
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      const details: Record<string, string[]> = {}
      for (const issue of error.issues) {
        const field = issue.path.join('.')
        if (!details[field]) details[field] = []
        details[field].push(issue.message)
      }
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})
