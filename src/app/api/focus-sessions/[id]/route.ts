import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { formatSession } from '@/lib/focus/sessions'

const endSchema = z.object({
  completed: z.boolean().default(false),
})

type Ctx = { params: Promise<{ id: string }> }

/** End a session, recording the real elapsed duration. */
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
      const endedAt = existing.endedAt ?? new Date()
      const durationSec = Math.max(
        0,
        Math.round((endedAt.getTime() - existing.startedAt.getTime()) / 1000)
      )
      const updated = await prisma.focusSession.update({
        where: { id },
        data: { endedAt, durationSec, completed: body.completed },
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
