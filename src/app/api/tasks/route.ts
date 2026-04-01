import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { createTaskSchema, taskQuerySchema } from '@/lib/validations/tasks'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const queryObj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryObj[key] = value
    })

    const query = taskQuerySchema.parse(queryObj)
    const { page, pageSize, sortBy, sortOrder } = query

    const where: Prisma.TaskWhereInput = { userId: user.id }

    if (query.status) where.status = query.status
    if (query.priority) where.priority = query.priority
    if (query.quadrant) where.quadrant = query.quadrant
    if (query.goalId) where.goalId = query.goalId
    if (query.parentTaskId) {
      where.parentTaskId = query.parentTaskId
    }
    if (query.tags) {
      where.tags = { hasSome: query.tags.split(',') }
    }
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' }
    }
    if (query.dueDate) {
      const date = new Date(query.dueDate)
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      where.dueDate = { gte: date, lt: nextDay }
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { subtasks: true } },
        },
      }),
      prisma.task.count({ where }),
    ])

    const items = tasks.map((task) => ({
      id: task.id,
      userId: task.userId,
      parentTaskId: task.parentTaskId,
      goalId: task.goalId,
      title: task.title,
      descriptionMd: task.descriptionMd,
      priority: task.priority,
      status: task.status,
      tags: task.tags,
      dueDate: task.dueDate?.toISOString() ?? null,
      completedAt: task.completedAt?.toISOString() ?? null,
      isRecurring: task.isRecurring,
      rrule: task.rrule,
      quadrant: task.quadrant,
      orderIndex: task.orderIndex,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      subtasksCount: task._count.subtasks,
    }))

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
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
          error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details },
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

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const data = createTaskSchema.parse(body)

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title: data.title,
        descriptionMd: data.descriptionMd,
        priority: data.priority,
        status: data.status,
        tags: data.tags,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        parentTaskId: data.parentTaskId ?? null,
        goalId: data.goalId ?? null,
        quadrant: data.quadrant ?? null,
        isRecurring: data.isRecurring,
        rrule: data.rrule ?? null,
        completedAt: data.status === 'completed' ? new Date() : null,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: task.id,
          userId: task.userId,
          parentTaskId: task.parentTaskId,
          goalId: task.goalId,
          title: task.title,
          descriptionMd: task.descriptionMd,
          priority: task.priority,
          status: task.status,
          tags: task.tags,
          dueDate: task.dueDate?.toISOString() ?? null,
          completedAt: task.completedAt?.toISOString() ?? null,
          isRecurring: task.isRecurring,
          rrule: task.rrule,
          quadrant: task.quadrant,
          orderIndex: task.orderIndex,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    )
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
