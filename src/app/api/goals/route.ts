import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { createGoalSchema, goalQuerySchema } from '@/lib/validations/goals'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const queryObj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryObj[key] = value
    })

    const query = goalQuerySchema.parse(queryObj)
    const { page, pageSize, sortBy, sortOrder } = query

    const where: Prisma.GoalWhereInput = { userId: user.id }

    if (query.status) where.status = query.status
    if (query.category) where.category = query.category

    const [goals, total] = await Promise.all([
      prisma.goal.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { tasks: true, habits: true } },
          tasks: { select: { status: true } },
        },
      }),
      prisma.goal.count({ where }),
    ])

    const items = goals.map((goal) => {
      const completedTaskCount = goal.tasks.filter(
        (t) => t.status === 'completed'
      ).length

      return {
        id: goal.id,
        userId: goal.userId,
        title: goal.title,
        description: goal.description,
        category: goal.category,
        targetDate: goal.targetDate?.toISOString() ?? null,
        status: goal.status,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
        taskCount: goal._count.tasks,
        completedTaskCount,
      }
    })

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
    const data = createGoalSchema.parse(body)

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: data.title,
        description: data.description,
        category: data.category ?? null,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        status: data.status,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: goal.id,
          userId: goal.userId,
          title: goal.title,
          description: goal.description,
          category: goal.category,
          targetDate: goal.targetDate?.toISOString() ?? null,
          status: goal.status,
          createdAt: goal.createdAt.toISOString(),
          updatedAt: goal.updatedAt.toISOString(),
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
