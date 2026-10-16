import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'
import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/prisma'
import { personalSettings, personalSettingsSchema } from '@/lib/data/settings'
export const GET = withAuth(async (_req, user) =>
  NextResponse.json(
    { success: true, data: personalSettings(user.timezone, user.preferences) },
    { headers: { 'Cache-Control': 'no-store' } }
  )
)
export const PATCH = withAuth(async (req, user) => {
  try {
    const { timezone, ...settings } = personalSettingsSchema.parse(await req.json())
    const saved = await prisma.$transaction(async (db) => {
      const current = await db.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      })
      const prefs = current.preferences as Record<string, Prisma.JsonValue>
      return db.user.update({
        where: { id: user.id },
        data: {
          timezone,
          preferences: { ...prefs, personal: settings, personalSetupComplete: true },
        },
      })
    })
    return NextResponse.json({
      success: true,
      data: personalSettings(saved.timezone, saved.preferences),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SETUP_ERROR',
          message:
            error instanceof ZodError
              ? 'Check the timezone, capacity and working window.'
              : 'Could not save personal setup. Your choices are kept; retry.',
        },
      },
      { status: error instanceof ZodError ? 400 : 500 }
    )
  }
})
