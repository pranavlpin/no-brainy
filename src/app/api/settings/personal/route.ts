import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { personalSettings, personalSettingsSchema } from '@/lib/settings/personal'

export const GET = withAuth(async (_req: NextRequest, user) =>
  NextResponse.json(
    { success: true, data: personalSettings(user.timezone, user.preferences) },
    { headers: { 'Cache-Control': 'no-store' } }
  )
)

/** Save personal defaults; the timezone keeps syncing from the browser separately. */
export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const settings = personalSettingsSchema.parse(await req.json())
    const prefs = (user.preferences ?? {}) as Record<string, Prisma.JsonValue>
    const saved = await prisma.user.update({
      where: { id: user.id },
      data: { preferences: { ...prefs, personal: settings, personalSetupComplete: true } },
    })
    return NextResponse.json({ success: true, data: personalSettings(saved.timezone, saved.preferences) })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message ?? 'Check the capacity and working window.' },
        },
        { status: 400 }
      )
    }
    console.error('[settings/personal]', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not save personal setup. Your choices are kept; retry.' } },
      { status: 500 }
    )
  }
})
