import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import type { AuthUser } from '@/lib/types/auth'

export interface NotificationPreferences {
  dueTasks: boolean
  overdueTasks: boolean
  habitReminders: boolean
  flashcardReminders: boolean
  dailyReviewReminders: boolean
}

const DEFAULTS: NotificationPreferences = {
  dueTasks: true,
  overdueTasks: true,
  habitReminders: true,
  flashcardReminders: true,
  dailyReviewReminders: true,
}

export const GET = withAuth(async (_req: NextRequest, user: AuthUser) => {
  const prefs = (user.preferences ?? {}) as Record<string, unknown>
  const notifPrefs = (prefs.notificationPreferences ?? {}) as Partial<NotificationPreferences>

  return NextResponse.json({
    success: true,
    data: { ...DEFAULTS, ...notifPrefs },
  })
})

export const PUT = withAuth(async (req: NextRequest, user: AuthUser) => {
  try {
    const body = await req.json()
    const incoming = body as Partial<NotificationPreferences>

    // Validate all values are booleans
    const validKeys = Object.keys(DEFAULTS) as (keyof NotificationPreferences)[]
    const notifPrefs: Record<string, boolean> = {}
    for (const key of validKeys) {
      if (key in incoming && typeof incoming[key] === 'boolean') {
        notifPrefs[key] = incoming[key]
      }
    }

    const currentPrefs = (user.preferences ?? {}) as Record<string, unknown>
    const updatedPrefs = {
      ...currentPrefs,
      notificationPreferences: {
        ...DEFAULTS,
        ...((currentPrefs.notificationPreferences ?? {}) as Record<string, boolean>),
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
