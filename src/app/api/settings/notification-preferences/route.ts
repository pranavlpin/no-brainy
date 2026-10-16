import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import type { AuthUser } from '@/lib/types/auth'
import {
  NOTIFICATION_PREF_DEFAULTS as DEFAULTS,
  NOTIFICATION_PREF_KEYS,
  resolveNotificationPreferences,
  type NotificationPreferences,
} from '@/lib/notifications/preferences'

export const GET = withAuth(async (_req: NextRequest, user: AuthUser) => {
  const prefs = (user.preferences ?? {}) as Record<string, unknown>
  return NextResponse.json({
    success: true,
    data: resolveNotificationPreferences(prefs.notificationPreferences as Record<string, unknown>),
  })
})

export const PUT = withAuth(async (req: NextRequest, user: AuthUser) => {
  try {
    const body = await req.json()
    const incoming = body as Partial<NotificationPreferences>

    // Validate all values are booleans
    const notifPrefs: Record<string, boolean> = {}
    for (const key of NOTIFICATION_PREF_KEYS) {
      if (key in incoming && typeof incoming[key] === 'boolean') {
        notifPrefs[key] = incoming[key]
      }
    }

    const currentPrefs = (user.preferences ?? {}) as Record<string, unknown>
    const updatedPrefs = {
      ...currentPrefs,
      notificationPreferences: {
        ...DEFAULTS,
        ...resolveNotificationPreferences(
          currentPrefs.notificationPreferences as Record<string, unknown>
        ),
        ...notifPrefs,
      },
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { preferences: updatedPrefs },
    })

    return NextResponse.json({
      success: true,
      data: updatedPrefs.notificationPreferences,
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})
