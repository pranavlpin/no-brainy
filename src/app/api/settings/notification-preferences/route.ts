import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { reminderPreferences, reminderSchema } from '@/lib/reviews/reminders'
export const GET = withAuth(async (_req, user) => {
  const prefs = (user.preferences ?? {}) as Record<string, unknown>
  return NextResponse.json({
    success: true,
    data: reminderPreferences(prefs.notificationPreferences),
  })
})
export const PUT = withAuth(async (req, user) => {
  try {
    const patch = reminderSchema.partial().parse(await req.json())
    const data = await prisma.$transaction(async (db) => {
      const current = await db.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      })
      const prefs = (current.preferences ?? {}) as Record<string, Prisma.JsonValue>
      const next = { ...reminderPreferences(prefs.notificationPreferences), ...patch }
      await db.user.update({
        where: { id: user.id },
        data: { preferences: { ...prefs, notificationPreferences: next } },
      })
      return next
    })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PREFERENCES_ERROR',
          message:
            error instanceof ZodError
              ? 'Choose a valid time and reminder preference'
              : 'Could not save preferences. Try again.',
        },
      },
      { status: error instanceof ZodError ? 400 : 500 }
    )
  }
})
