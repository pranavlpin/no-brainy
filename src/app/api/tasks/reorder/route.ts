import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { reorderSchema } from '@/lib/validations/tasks'
import { ZodError } from 'zod'

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const { tasks } = reorderSchema.parse(body)

    const taskIds = tasks.map((t) => t.id)

    // Verify all tasks belong to the user
    const ownedCount = await prisma.task.count({
      where: { id: { in: taskIds }, userId: user.id },
    })

    if (ownedCount !== taskIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'One or more tasks do not belong to the current user',
          },
        },
        { status: 403 }
      )
    }

    await prisma.$transaction(
      tasks.map((t) =>
        prisma.task.update({
          where: { id: t.id },
          data: { orderIndex: t.orderIndex },
        })
      )
    )

    return NextResponse.json({
      success: true,
      data: { updated: tasks.length },
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
