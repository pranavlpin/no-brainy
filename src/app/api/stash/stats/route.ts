import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import type { StashStats } from '@/types/stash'
import type { ApiResponse } from '@/lib/types/api'

export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    const [channelCount, messageCount] = await Promise.all([
      prisma.stashChannel.count({
        where: { userId: user.id, isDeleted: false },
      }),
      prisma.stashMessage.count({
        where: { userId: user.id, isDeleted: false },
      }),
    ])

    const response: ApiResponse<StashStats> = {
      success: true,
      data: { channelCount, messageCount },
    }
    return NextResponse.json(response)
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not load stats' } },
      { status: 500 }
    )
  }
})
