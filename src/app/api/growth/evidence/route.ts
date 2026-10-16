import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { evidenceSchema, growthQuerySchema } from '@/lib/validations/growth'
import {
  GrowthError,
  growthFailure,
  ownedGrowthSource,
  serializeEvidence,
} from '@/lib/growth/server'
import { todayInTimezone } from '@/lib/dates/calendar'
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const input = growthQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    const where = { userId: user.id, ...(input.goalId && { goalId: input.goalId }) }
    const [items, total] = await Promise.all([
      prisma.growthEvidence.findMany({
        where,
        orderBy: [{ observedAt: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      prisma.growthEvidence.count({ where }),
    ])
    return NextResponse.json({
      success: true,
      data: {
        items: await Promise.all(items.map((item) => serializeEvidence(item, user.timezone))),
        total,
        page: input.page,
        pageSize: input.pageSize,
        hasMore: input.page * input.pageSize < total,
      },
    })
  } catch (error) {
    return growthFailure(error)
  }
})
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const input = evidenceSchema.parse(await req.json())
    if (input.observedAt > todayInTimezone(user.timezone))
      throw new GrowthError(
        400,
        'Evidence describes an observation already made; choose today or an earlier date'
      )
    const item = await prisma.$transaction(async (db) => {
      await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
      const prior = await db.growthEvidence.findUnique({
        where: {
          userId_clientRequestId: { userId: user.id, clientRequestId: input.clientRequestId },
        },
      })
      if (prior) return prior
      if (!(await db.goal.findFirst({ where: { id: input.goalId, userId: user.id } })))
        throw new GrowthError(400, 'Choose a goal from your workspace')
      const source =
        input.sourceType && input.sourceId
          ? await ownedGrowthSource(db, user.id, input.sourceType, input.sourceId, user.timezone)
          : null
      if (input.kind === 'practice' && source?.observedAt && source.observedAt !== input.observedAt)
        throw new GrowthError(
          400,
          `This session took place on ${source.observedAt}. Use that date for practice, or save a reflection instead.`
        )
      return db.growthEvidence.create({
        data: {
          ...input,
          userId: user.id,
          observedAt: new Date(`${input.observedAt}T00:00:00Z`),
          sourceTitle: source?.title,
          practiceKey: source?.practiceKey,
        },
      })
    })
    return NextResponse.json(
      { success: true, data: await serializeEvidence(item, user.timezone) },
      { status: 201 }
    )
  } catch (error) {
    return growthFailure(error)
  }
})
