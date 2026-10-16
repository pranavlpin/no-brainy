import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { isValidDateKey, localDayBounds, todayKey, userTimezone } from '@/lib/dates'
import { closeStaleSessions, formatSession } from '@/lib/focus/sessions'
import type { FocusDayResponse } from '@/lib/types/focus'

const startSchema = z.object({
  taskId: z.string().min(1).nullable().optional(),
  kind: z.enum(['work', 'break']).default('work'),
  /** What this block is for, in the user's words. */
  intention: z.string().trim().max(300).default(''),
})

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
      data: {
        userId: user.id,
        taskId: body.taskId ?? null,
        kind: body.kind,
        intention: body.intention,
      },
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
