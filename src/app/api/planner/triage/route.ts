import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { triageSchema } from '@/lib/validations/planner'
import { dateFromKey, todayKey, userTimezone } from '@/lib/dates'
import { formatTask } from '@/lib/tasks/format'
import type { Prisma } from '@prisma/client'

/**
 * Morning triage for a leftover task: keep it today, move it to a later
 * date, or drop it (cancelled, never deleted).
 */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = triageSchema.parse(await req.json())
    const today = todayKey(userTimezone(user))

    const task = await prisma.task.findFirst({ where: { id: body.taskId, userId: user.id } })
    if (!task) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } },
        { status: 404 }
      )
    }

    let data: Prisma.TaskUpdateInput
    if (body.action === 'keep') {
      data = { dueDate: dateFromKey(today) }
    } else if (body.action === 'move') {
      if (!body.date || body.date <= today) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Pick a date after today' },
          },
          { status: 400 }
        )
      }
      data = { dueDate: dateFromKey(body.date) }
    } else {
      data = { status: 'cancelled' }
    }

    const updated = await prisma.task.update({ where: { id: task.id }, data })
    return NextResponse.json({ success: true, data: formatTask(updated) })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.flatten() },
        },
        { status: 400 }
      )
    }
    console.error('[planner/triage]', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})
