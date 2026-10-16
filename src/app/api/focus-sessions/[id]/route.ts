import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { finishSession, formatSession, sessionDuration } from '@/lib/focus/sessions'

const endSchema = z.object({
  completed: z.boolean().optional(),
  /** Present when the user records a result; completed finishes the linked task. */
  outcome: z.enum(['completed', 'progress', 'blocked']).optional(),
  reflection: z.string().trim().max(4000).optional(),
  nextAction: z.string().trim().max(500).optional(),
})

type Ctx = { params: Promise<{ id: string }> }

/**
 * End a session, recording the real elapsed duration. With an `outcome` the
 * result is stored once: a second finish returns what was saved.
 */
export const PATCH = (req: NextRequest, ctx: Ctx) =>
  withAuth(async (request: NextRequest, user) => {
    try {
      const { id } = await ctx.params
      const body = endSchema.parse(await request.json().catch(() => ({})))
      const existing = await prisma.focusSession.findFirst({ where: { id, userId: user.id } })
      if (!existing) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } },
          { status: 404 }
        )
      }
      if (body.outcome) {
        if (existing.outcome) {
          return NextResponse.json({ success: true, data: formatSession(existing) })
        }
        const now = new Date()
        const finished = await prisma.$transaction((db) =>
          finishSession(
            db,
            user.id,
            existing,
            { outcome: body.outcome!, reflection: body.reflection, nextAction: body.nextAction },
            now
          )
        )
        return NextResponse.json({ success: true, data: formatSession(finished) })
      }
      const endedAt = existing.endedAt ?? new Date()
      const updated = await prisma.focusSession.update({
        where: { id },
        data: {
          endedAt,
          durationSec: sessionDuration(existing.startedAt, endedAt),
          completed: body.completed ?? false,
        },
      })
      return NextResponse.json({ success: true, data: formatSession(updated) })
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } },
          { status: 400 }
        )
      }
      console.error('[focus-sessions PATCH]', error)
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
        },
        { status: 500 }
      )
    }
  })(req)
