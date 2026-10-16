import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { evidenceEditSchema } from '@/lib/validations/growth'
import {
  GrowthError,
  growthFailure,
  serializeEvidence,
  ownedGrowthSource,
} from '@/lib/growth/server'
import { todayInTimezone } from '@/lib/dates/calendar'
export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').at(-1)!
    const { expectedUpdatedAt, observedAt, ...input } = evidenceEditSchema.parse(await req.json())
    if (observedAt && observedAt > todayInTimezone(user.timezone))
      throw new GrowthError(400, 'Choose today or an earlier observation date')
    const existing = await prisma.growthEvidence.findFirst({ where: { id, userId: user.id } })
    if (!existing) throw new GrowthError(404, 'Evidence not found')
    if (
      existing.sourceType === 'session' &&
      existing.sourceId &&
      (input.kind ?? existing.kind) === 'practice' &&
      (observedAt || input.kind)
    ) {
      const source = await ownedGrowthSource(
        prisma,
        user.id,
        'session',
        existing.sourceId,
        user.timezone
      )
      if (source.observedAt !== (observedAt ?? existing.observedAt.toISOString().slice(0, 10)))
        throw new GrowthError(
          400,
          `This session took place on ${source.observedAt}. Use that practice date or save a reflection instead.`
        )
    }
    const result = await prisma.$transaction(async (db) => {
      const updated = await db.growthEvidence.updateMany({
        where: { id, userId: user.id, updatedAt: new Date(expectedUpdatedAt) },
        data: {
          ...input,
          ...(observedAt && { observedAt: new Date(`${observedAt}T00:00:00Z`) }),
          updatedAt: new Date(Math.max(Date.now(), existing.updatedAt.getTime() + 1)),
        },
      })
      if (!updated.count)
        throw new GrowthError(
          409,
          'This evidence changed elsewhere. Refresh before saving your correction.'
        )
      return db.growthEvidence.findUniqueOrThrow({ where: { id } })
    })
    return NextResponse.json({
      success: true,
      data: await serializeEvidence(result, user.timezone),
    })
  } catch (error) {
    return growthFailure(error)
  }
})
export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const deleted = await prisma.growthEvidence.deleteMany({
      where: { id: req.nextUrl.pathname.split('/').at(-1)!, userId: user.id },
    })
    if (!deleted.count) throw new GrowthError(404, 'Evidence not found')
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return growthFailure(error)
  }
})
