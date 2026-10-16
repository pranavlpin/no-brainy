import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { startFocusSchema, focusCommandSchema } from '@/lib/validations/focus'
import { elapsedSeconds } from '@/lib/focus/clock'
import { advanceRoutine } from '@/lib/tasks/routine-service'
import { todayInTimezone } from '@/lib/dates/calendar'

class FocusError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
  }
}
function failure(error: unknown) {
  const status = error instanceof FocusError ? error.status : error instanceof ZodError ? 400 : 500
  return NextResponse.json(
    {
      success: false,
      error: {
        code: status === 409 ? 'CONFLICT' : 'FOCUS_ERROR',
        message:
          error instanceof FocusError
            ? error.message
            : error instanceof ZodError
              ? error.issues[0].message
              : 'Could not save this session. Your input is kept; retry when connected.',
      },
    },
    { status }
  )
}
export const GET = withAuth(async (_req, user) => {
  try {
    const [active, recent] = await Promise.all([
      prisma.focusSession.findFirst({ where: { userId: user.id, activeOwner: user.id } }),
      prisma.focusSession.findMany({
        where: { userId: user.id, state: 'finished' },
        orderBy: [{ completedAt: 'desc' }, { id: 'asc' }],
        take: 50,
      }),
    ])
    return NextResponse.json({
      success: true,
      data: { active, recent, serverNow: new Date().toISOString() },
    })
  } catch (error) {
    return failure(error)
  }
})
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const input = startFocusSchema.parse(await req.json())
    const result = await prisma.$transaction(async (db) => {
      // Serialize starts/results for this owner before reading active session state.
      await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
      const prior = await db.focusSession.findUnique({
        where: {
          userId_clientRequestId: { userId: user.id, clientRequestId: input.clientRequestId },
        },
      })
      if (prior) return prior
      if (await db.focusSession.findFirst({ where: { activeOwner: user.id } }))
        throw new FocusError(409, 'A session is already active. Open it before starting another.')
      const task = input.taskId
        ? await db.task.findFirst({
            where: {
              id: input.taskId,
              userId: user.id,
              status: { in: ['pending', 'in_progress'] },
            },
          })
        : null
      if (input.taskId && !task)
        throw new FocusError(400, 'Choose an active task from your workspace')
      return db.focusSession.create({
        data: {
          ...input,
          userId: user.id,
          activeOwner: user.id,
          taskTitle: task?.title ?? 'Open focus',
          activeSince: new Date(),
        },
      })
    })
    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error) {
    return failure(error)
  }
})
export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const input = focusCommandSchema.parse(await req.json())
    const result = await prisma.$transaction(async (db) => {
      await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
      const current = await db.focusSession.findFirst({ where: { id: input.id, userId: user.id } })
      if (!current) throw new FocusError(404, 'Session not found')
      if (current.state === 'finished') {
        if (
          input.action === 'finish' &&
          current.outcome === input.outcome &&
          current.reflection === input.reflection &&
          current.nextAction === input.nextAction
        )
          return current
        throw new FocusError(409, 'This session already has a saved result. Refresh to see it.')
      }
      const target =
        input.action === 'pause' ? 'paused' : input.action === 'resume' ? 'running' : 'finished'
      if (current.state === target) return current
      if (current.updatedAt.toISOString() !== input.expectedUpdatedAt)
        throw new FocusError(
          409,
          'This session changed in another tab. Refresh its state before trying again.'
        )
      const now = new Date(Math.max(Date.now(), current.updatedAt.getTime() + 1))
      const seconds = elapsedSeconds(current, now.getTime())
      if (target === 'running' && seconds >= current.plannedSeconds)
        throw new FocusError(
          400,
          'Your chosen time is complete. Record a result before starting again.'
        )
      let nextActionId: string | null = null
      const task = current.taskId
        ? await db.task.findFirst({ where: { id: current.taskId, userId: user.id } })
        : null
      if (
        target === 'finished' &&
        input.outcome === 'completed' &&
        task &&
        task.status !== 'completed'
      ) {
        const completed = await db.task.update({
          where: { id: task.id },
          data: { status: 'completed', completedAt: now },
        })
        await advanceRoutine(db, completed, todayInTimezone(user.timezone))
        await db.project.updateMany({
          where: { userId: user.id, nextActionId: task.id },
          data: { nextActionId: null },
        })
      }
      if (target === 'finished' && input.nextAction) {
        nextActionId = (
          await db.task.create({
            data: {
              userId: user.id,
              title: input.nextAction,
              goalId: task?.goalId,
              projectId: task?.projectId,
              context: task?.context,
              descriptionMd: `Next action from focus session ${current.id}.\n\n${input.reflection}`,
            },
          })
        ).id
        if (task?.projectId)
          await db.project.updateMany({
            where: { id: task.projectId, userId: user.id, nextActionId: null },
            data: { nextActionId },
          })
      }
      return db.focusSession.update({
        where: { id: current.id },
        data: {
          state: target,
          accumulatedSeconds: seconds,
          activeSince: target === 'running' ? now : null,
          updatedAt: now,
          ...(target === 'finished' && {
            activeOwner: null,
            completedAt: now,
            outcome: input.outcome,
            reflection: input.reflection,
            nextAction: input.nextAction,
            nextActionId,
          }),
        },
      })
    })
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return failure(error)
  }
})
