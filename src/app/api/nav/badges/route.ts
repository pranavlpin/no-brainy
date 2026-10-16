import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { dayBoundsUtc, todayKey, userTimezone } from '@/lib/dates'

/** Counters for sidebar badges: cards due, overdue tasks, unread notifications. */
export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    const key = todayKey(userTimezone(user))
    const { start: today } = dayBoundsUtc(key)
    const [cardsDue, overdueTasks, unreadNotifications] = await Promise.all([
      prisma.flashcard.count({ where: { userId: user.id, nextReviewAt: { lte: today } } }),
      prisma.task.count({
        where: {
          userId: user.id,
          dueDate: { lt: today },
          status: { notIn: ['completed', 'cancelled'] },
        },
      }),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ])
    return NextResponse.json({
      success: true,
      data: { cardsDue, overdueTasks, unreadNotifications },
    })
  } catch (error) {
    console.error('[nav/badges]', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})
