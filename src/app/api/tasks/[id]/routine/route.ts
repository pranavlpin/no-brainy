import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { todayInTimezone } from '@/lib/dates/calendar'
import { initializeRoutine, advanceRoutine } from '@/lib/tasks/routine-service'
import { supportedRecurrence } from '@/lib/tasks/recurrence'
import { serializeTask } from '@/lib/tasks/serialize'

const actionSchema = z.object({ action: z.enum(['pause', 'resume', 'skip']) })
const fail = (message: string, status: number) =>
  NextResponse.json(
    { success: false, error: { code: status === 404 ? 'NOT_FOUND' : 'VALIDATION_ERROR', message } },
    { status }
  )

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').at(-2)!
    const { action } = actionSchema.parse(await req.json())
    const original = await prisma.task.findFirst({ where: { id, userId: user.id } })
    if (!original) return fail('Task not found', 404)
    if (!original.isRecurring || !supportedRecurrence(original.rrule))
      return fail(
        'Choose a supported daily, weekly or monthly routine first. The existing rule has been kept.',
        400
      )
    const today = todayInTimezone(user.timezone)
    const result = await prisma.$transaction(async (db) => {
      const task = await initializeRoutine(db, original, today)
      const rootId = task.routineId!
      if (action === 'pause' || action === 'resume') {
        await db.task.updateMany({
          where: { userId: user.id, OR: [{ id: rootId }, { routineId: rootId }] },
          data: { routinePaused: action === 'pause' },
        })
        if (action === 'resume') {
          const active = await db.task.findFirst({
            where: {
              userId: user.id,
              routineId: rootId,
              status: { in: ['pending', 'in_progress'] },
            },
          })
          if (!active) {
            const latest = await db.task.findFirstOrThrow({
              where: { userId: user.id, routineId: rootId },
              orderBy: { occurrenceDate: 'desc' },
            })
            await advanceRoutine(db, latest, today, true)
          }
        }
      } else {
        const changed = await db.task.updateMany({
          where: { id, userId: user.id, status: { in: ['pending', 'in_progress'] } },
          data: { status: 'cancelled', completedAt: null },
        })
        if (changed.count) {
          await db.project.updateMany({
            where: { userId: user.id, nextActionId: id },
            data: { nextActionId: null },
          })
          await advanceRoutine(db, { ...task, status: 'cancelled' }, today)
        }
      }
      return db.task.findUniqueOrThrow({ where: { id } })
    })
    return NextResponse.json({ success: true, data: serializeTask(result) })
  } catch (error) {
    return fail(
      error instanceof z.ZodError
        ? 'Choose pause, resume or skip'
        : 'Could not update this routine. Please try again.',
      error instanceof z.ZodError ? 400 : 500
    )
  }
})
