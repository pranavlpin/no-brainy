import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth/middleware'

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  const insightId = req.nextUrl.pathname.split('/').at(-2)

  if (!insightId) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Missing insight ID' } },
      { status: 400 }
    )
  }

  const insight = await prisma.insight.findFirst({
    where: { id: insightId, userId: user.id },
  })

  if (!insight) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Insight not found' } },
      { status: 404 }
    )
  }

  await prisma.insight.update({
    where: { id: insightId },
    data: { isDismissed: true },
  })

  return NextResponse.json({
    success: true,
    data: { id: insightId, isDismissed: true },
  })
}
