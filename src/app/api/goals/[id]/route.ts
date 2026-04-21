import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { updateGoalSchema } from '@/lib/validations/goals'
import { ZodError } from 'zod'

function extractId(url: string): string {
  const segments = new URL(url).pathname.split('/')
  // /api/goals/[id] => segments = ['', 'api', 'goals', '<id>']
  return segments[segments.length - 1]
}

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const id = extractId(req.url)

    const goal = await prisma.goal.findFirst({
      where: { id, userId: user.id },
      include: {
        habits: true,
        tasks: { select: { id: true, status: true } },
      },
    })

    if (!goal) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Goal not found' },
        },
        { status: 404 }
      )
    }

    const taskCount = goal.tasks.length
    const completedTaskCount = goal.tasks.filter(
      (t) => t.status === 'completed'
    ).length

    return NextResponse.json({
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
        taskCount,
        completedTaskCount,
        habits: goal.habits.map((h) => ({
          id: h.id,
          userId: h.userId,
          goalId: h.goalId,
          title: h.title,
          frequency: h.frequency,
          createdAt: h.createdAt.toISOString(),
        })),
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

export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const id = extractId(req.url)
    const body = await req.json()
    const data = updateGoalSchema.parse(body)

    const existing = await prisma.goal.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Goal not found' },
        },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.category !== undefined) updateData.category = data.category
    if (data.status !== undefined) updateData.status = data.status
    if (data.targetDate !== undefined) {
      updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
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

export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const id = extractId(req.url)

    const existing = await prisma.goal.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Goal not found' },
        },
        { status: 404 }
      )
    }

    await prisma.goal.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      data: { id },
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
