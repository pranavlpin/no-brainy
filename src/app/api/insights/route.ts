import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth/middleware'
import type { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  const { searchParams } = req.nextUrl
  const dismissed = searchParams.get('dismissed')
  const type = searchParams.get('type')

  const where: Prisma.InsightWhereInput = {
    userId: user.id,
    isDismissed: dismissed === 'true' ? true : false,
    OR: [
      { validUntil: null },
      { validUntil: { gte: new Date() } },
    ],
  }

  if (type) {
    where.insightType = type
  }

  const insights = await prisma.insight.findMany({
    where,
    orderBy: { generatedAt: 'desc' },
  })

  return NextResponse.json({
    success: true,
    data: {
      insights,
      total: insights.length,
    },
  })
}
