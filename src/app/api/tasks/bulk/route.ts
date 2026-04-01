import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { bulkActionSchema } from '@/lib/validations/tasks'
import { ZodError } from 'zod'

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const { taskIds, action, priority } = bulkActionSchema.parse(body)

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

    let affected = 0

    switch (action) {
      case 'complete': {
        const result = await prisma.task.updateMany({
          where: { id: { in: taskIds }, userId: user.id },
          data: { status: 'completed', completedAt: new Date() },
        })
        affected = result.count
        break
      }
      case 'delete': {
        const result = await prisma.task.deleteMany({
          where: { id: { in: taskIds }, userId: user.id },
        })
        affected = result.count
        break
      }
      case 'setPriority': {
        if (!priority) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Priority is required for setPriority action',
              },
            },
            { status: 400 }
          )
        }
        const result = await prisma.task.updateMany({
          where: { id: { in: taskIds }, userId: user.id },
          data: { priority },
        })
        affected = result.count
        break
      }
    }

    return NextResponse.json({
      success: true,
      data: { affected },
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
