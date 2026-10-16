import type { FocusSession, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { STALE_GRACE_MS, WORK_SEC } from '@/lib/focus/timer'
import type { FinishSessionInput, FocusSessionResponse } from '@/lib/types/focus'

/** Serialize a focus session row for API responses. */
export function formatSession(s: FocusSession): FocusSessionResponse {
  return {
    id: s.id,
    userId: s.userId,
    taskId: s.taskId,
    kind: s.kind as FocusSessionResponse['kind'],
    startedAt: s.startedAt.toISOString(),
    endedAt: s.endedAt?.toISOString() ?? null,
    durationSec: s.durationSec,
    completed: s.completed,
    intention: s.intention ?? '',
    outcome: (s.outcome as FocusSessionResponse['outcome']) ?? null,
    reflection: s.reflection ?? '',
    nextAction: s.nextAction ?? null,
    nextActionTaskId: s.nextActionTaskId ?? null,
  }
}

/** Real elapsed seconds between start and end, never negative. */
export function sessionDuration(startedAt: Date, endedAt: Date): number {
  return Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000))
}

/**
 * Record a session's result. Only `completed` finishes the linked task; a
 * next action becomes an undated task on the same goal. Runs inside the
 * caller's transaction so the task and the session change together.
 */
export async function finishSession(
  db: Prisma.TransactionClient,
  userId: string,
  session: FocusSession,
  input: FinishSessionInput,
  now: Date
): Promise<FocusSession> {
  const endedAt = session.endedAt ?? now
  const task = session.taskId
    ? await db.task.findFirst({ where: { id: session.taskId, userId } })
    : null

  if (input.outcome === 'completed' && task && task.status !== 'completed') {
    await db.task.update({
      where: { id: task.id },
      data: { status: 'completed', completedAt: now },
    })
  }

  let nextActionTaskId: string | null = null
  const nextAction = input.nextAction?.trim() || null
  if (nextAction) {
    const created = await db.task.create({
      data: {
        userId,
        title: nextAction,
        goalId: task?.goalId ?? null,
        context: task?.context ?? null,
        descriptionMd: `Next action from a focus session${task ? ` on "${task.title}"` : ''}.${
          input.reflection?.trim() ? `\n\n${input.reflection.trim()}` : ''
        }`,
      },
    })
    nextActionTaskId = created.id
  }

  return db.focusSession.update({
    where: { id: session.id },
    data: {
      endedAt,
      durationSec: sessionDuration(session.startedAt, endedAt),
      completed: true,
      outcome: input.outcome,
      reflection: input.reflection?.trim() ?? '',
      nextAction,
      nextActionTaskId,
    },
  })
}

/** Close sessions left open for longer than the grace period at one pomodoro length. */
export async function closeStaleSessions(userId: string, now: Date): Promise<void> {
  const cutoff = new Date(now.getTime() - STALE_GRACE_MS)
  const stale = await prisma.focusSession.findMany({
    where: { userId, endedAt: null, startedAt: { lt: cutoff } },
    select: { id: true, startedAt: true },
  })
  if (stale.length === 0) {
    // Still call updateMany so callers can rely on a single code path.
    await prisma.focusSession.updateMany({ where: { id: { in: [] } }, data: {} })
    return
  }
  await Promise.all(
    stale.map((s) =>
      prisma.focusSession.updateMany({
        where: { id: s.id },
        data: {
          endedAt: new Date(s.startedAt.getTime() + WORK_SEC * 1000),
          durationSec: WORK_SEC,
          completed: false,
        },
      })
    )
  )
}
