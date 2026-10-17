import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import type { Prisma } from '@prisma/client'
import type { AuthUser } from '@/lib/types/auth'
import {
  NOTIFICATION_PREF_DEFAULTS as DEFAULTS,
  NOTIFICATION_PREF_KEYS,
  resolveNotificationPreferences,
  resolveNotificationSettings,
  resolveReminderSettings,
  type NotificationSettings,
} from '@/lib/notifications/preferences'

const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/

export const GET = withAuth(async (_req: NextRequest, user: AuthUser) => {
  const prefs = (user.preferences ?? {}) as Record<string, unknown>
  return NextResponse.json({
    success: true,
    data: resolveNotificationSettings(prefs.notificationPreferences as Record<string, unknown>),
  })
})

export const PUT = withAuth(async (req: NextRequest, user: AuthUser) => {
  try {
    const body = await req.json()
    const incoming = body as Partial<NotificationSettings>

    // Booleans are taken as given; timing fields are validated as HH:mm.
    const notifPrefs: Record<string, unknown> = {}
    for (const key of NOTIFICATION_PREF_KEYS) {
      if (key in incoming && typeof incoming[key] === 'boolean') {
        notifPrefs[key] = incoming[key]
      }
    }
    if ('quietHours' in incoming) {
      const q = incoming.quietHours
      if (q === null) notifPrefs.quietHours = null
      else if (q && TIME.test(q.start) && TIME.test(q.end) && q.start !== q.end)
        notifPrefs.quietHours = q
      else {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Quiet hours need a start and an end that differ',
            },
          },
          { status: 400 }
        )
      }
    }
    if ('reviewReminderTime' in incoming) {
      const t = incoming.reviewReminderTime
      if (typeof t !== 'string' || !TIME.test(t)) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Use a 24-hour time like 20:00' },
          },
          { status: 400 }
        )
      }
      notifPrefs.reviewReminderTime = t
    }

    const currentPrefs = (user.preferences ?? {}) as Record<string, unknown>
    const stored = currentPrefs.notificationPreferences as Record<string, unknown> | undefined
    const updatedPrefs = {
      ...currentPrefs,
      notificationPreferences: {
        ...DEFAULTS,
        ...resolveNotificationPreferences(stored),
        ...resolveReminderSettings(stored),
        ...notifPrefs,
      },
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { preferences: updatedPrefs as unknown as Prisma.InputJsonValue },
    })

    return NextResponse.json({
      success: true,
      data: resolveNotificationSettings(
        updatedPrefs.notificationPreferences as Record<string, unknown>
      ),
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
