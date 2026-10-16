import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { dateFromKey, todayKey, userTimezone } from '@/lib/dates'
import { evidenceQuerySchema, evidenceSchema } from '@/lib/validations/growth'
import { GrowthError, growthFailure, ownedGrowthSource, serializeEvidence } from '@/lib/growth/server'

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const q = evidenceQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    const where = {
      userId: user.id,
      ...(q.goalId && { goalId: q.goalId }),
      ...(q.kind && { kind: q.kind }),
    }
    const [items, total] = await Promise.all([
      prisma.growthEvidence.findMany({
        where,
        orderBy: [{ observedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.growthEvidence.count({ where }),
    ])
    return NextResponse.json({
      success: true,
      data: {
        items: items.map(serializeEvidence),
        total,
        page: q.page,
        pageSize: q.pageSize,
        hasMore: q.page * q.pageSize < total,
      },
    })
  } catch (error) {
    return growthFailure(error)
  }
})

/** Record evidence once per client request id; the source is snapshotted by title. */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const input = evidenceSchema.parse(await req.json())
    const tz = userTimezone(user)
    if (input.observedAt > todayKey(tz)) {
      throw new GrowthError(400, 'Evidence describes something already observed. Choose today or earlier.')
    }
    const item = await prisma.$transaction(async (db) => {
      const prior = await db.growthEvidence.findUnique({
        where: { userId_clientRequestId: { userId: user.id, clientRequestId: input.clientRequestId } },
      })
      if (prior) return prior
      const goal = await db.goal.findFirst({ where: { id: input.goalId, userId: user.id } })
      if (!goal) throw new GrowthError(400, 'Choose a goal from your own workspace')
      const source =
        input.sourceType && input.sourceId
          ? await ownedGrowthSource(db, user.id, input.sourceType, input.sourceId, tz)
          : null
      return db.growthEvidence.create({
        data: {
          userId: user.id,
          goalId: input.goalId,
          clientRequestId: input.clientRequestId,
          observedAt: dateFromKey(input.observedAt),
          summary: input.summary,
          measurement: input.measurement ?? null,
          kind: input.kind,
          sourceType: source?.type ?? null,
          sourceId: source?.id ?? null,
          sourceTitle: source?.title ?? null,
        },
      })
    })
    return NextResponse.json({ success: true, data: serializeEvidence(item) }, { status: 201 })
  } catch (error) {
    return growthFailure(error)
  }
})
