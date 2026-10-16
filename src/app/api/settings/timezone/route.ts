import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { userTimezone } from '@/lib/dates'
import type { AuthUser } from '@/lib/types/auth'

// Intl.supportedValuesOf omits IANA link names such as Asia/Kolkata (ICU
// canonicalizes it to Asia/Calcutta), so validate by construction instead.
function isSupportedTimezone(tz: string): boolean {
  if (!/^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+){0,2}$/.test(tz)) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** Current stored timezone and the zone the server will actually use. */
export const GET = withAuth(async (_req: NextRequest, user: AuthUser) => {
  return NextResponse.json({
    success: true,
    data: { timezone: user.timezone, effective: userTimezone(user) },
  })
})

/** Store the browser-detected timezone. */
export const PATCH = withAuth(async (req: NextRequest, user: AuthUser) => {
  let body: { timezone?: unknown }
  try {
    body = (await req.json()) as { timezone?: unknown }
  } catch {
    body = {}
  }
  const tz = typeof body.timezone === 'string' ? body.timezone.trim() : ''
  if (!tz || !isSupportedTimezone(tz)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Unknown timezone' },
      },
      { status: 400 }
    )
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { timezone: tz },
    select: { timezone: true },
  })
  return NextResponse.json({
    success: true,
    data: { timezone: updated.timezone, effective: userTimezone(updated) },
  })
})
