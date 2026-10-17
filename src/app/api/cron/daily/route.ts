import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateForUser } from '@/lib/notifications/generate'

const BATCH = 50

/**
 * Scheduler entry point: run today's nudges for every user.
 * Protect with `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_CONFIGURED', message: 'CRON_SECRET is not set' } },
      { status: 503 }
    )
  }
  const auth = req.headers.get('authorization') ?? ''
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Bad or missing bearer token' } },
      { status: 401 }
    )
  }

  const now = new Date()
  const perUser: { userId: string; created: string[] }[] = []
  let cursor: string | undefined
  for (;;) {
    const users = await prisma.user.findMany({
      select: { id: true, timezone: true, preferences: true },
      orderBy: { id: 'asc' },
      take: BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })
    if (users.length === 0) break
    for (const u of users) {
      try {
        const result = await generateForUser(
          { id: u.id, timezone: u.timezone, preferences: u.preferences as Record<string, unknown> },
          now
        )
        perUser.push({ userId: u.id, created: result.created })
      } catch (error) {
        console.error('[cron/daily] user failed', u.id, error)
        perUser.push({ userId: u.id, created: [] })
      }
    }
    cursor = users[users.length - 1].id
    if (users.length < BATCH) break
  }

  const created = perUser.reduce((sum, p) => sum + p.created.length, 0)
  return NextResponse.json({
    success: true,
    data: { ranAt: now.toISOString(), users: perUser.length, created, perUser },
  })
}
