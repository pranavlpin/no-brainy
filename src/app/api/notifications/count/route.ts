import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'

export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    })

    return NextResponse.json({
      success: true,
      data: { unreadCount },
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
