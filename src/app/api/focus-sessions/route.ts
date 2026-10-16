import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import type { FocusSession } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { isValidDateKey, localDayBounds, todayKey, userTimezone } from '@/lib/dates'
import { STALE_GRACE_MS, WORK_SEC } from '@/lib/focus/timer'
import type { FocusDayResponse, FocusSessionResponse } from '@/lib/types/focus'

const startSchema = z.object({
  taskId: z.string().min(1).nullable().optional(),
  kind: z.enum(['work', 'break']).default('work'),
})

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

/** Sessions for one local day plus total work minutes. */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const tz = userTimezone(user)
    const now = new Date()
    const param = new URL(req.url).searchParams.get('date')
    const date = param && isValidDateKey(param) ? param : todayKey(tz, now)

    await closeStaleSessions(user.id, now)

    const { start, end } = localDayBounds(date, tz)
    const sessions = await prisma.focusSession.findMany({
      where: { userId: user.id, startedAt: { gte: start, lt: end } },
      orderBy: { startedAt: 'asc' },
    })
    const work = sessions.filter((s) => s.kind === 'work' && s.endedAt)
    const totalWorkMinutes = Math.round(work.reduce((sum, s) => sum + s.durationSec, 0) / 60)
    const data: FocusDayResponse = {
      date,
      sessions: sessions.map(formatSession),
      totalWorkMinutes,
      pomodorosCompleted: work.filter((s) => s.completed).length,
    }
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[focus-sessions GET]', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})

/** Start a session. */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = startSchema.parse(await req.json().catch(() => ({})))
    const session = await prisma.focusSession.create({
      data: { userId: user.id, taskId: body.taskId ?? null, kind: body.kind },
    })
    return NextResponse.json({ success: true, data: formatSession(session) }, { status: 201 })
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
    console.error('[focus-sessions POST]', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})
