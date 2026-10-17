import type { FocusSession } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { STALE_GRACE_MS, WORK_SEC } from '@/lib/focus/timer'
import type { FocusSessionResponse } from '@/lib/types/focus'

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
  }
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
