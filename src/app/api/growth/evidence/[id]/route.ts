import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { dateFromKey, todayKey, userTimezone } from '@/lib/dates'
import { evidenceEditSchema } from '@/lib/validations/growth'
import { GrowthError, growthFailure, serializeEvidence } from '@/lib/growth/server'

/** Correct an observation. The source is immutable; the row is versioned. */
export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').pop()!
    const { expectedUpdatedAt, observedAt, ...input } = evidenceEditSchema.parse(await req.json())
    if (observedAt && observedAt > todayKey(userTimezone(user))) {
      throw new GrowthError(400, 'Choose today or an earlier observation date')
    }
    const existing = await prisma.growthEvidence.findFirst({ where: { id, userId: user.id } })
    if (!existing) throw new GrowthError(404, 'Evidence not found')
    const result = await prisma.$transaction(async (db) => {
      const updated = await db.growthEvidence.updateMany({
        where: { id, userId: user.id, updatedAt: new Date(expectedUpdatedAt) },
        data: {
          ...input,
          ...(observedAt && { observedAt: dateFromKey(observedAt) }),
          updatedAt: new Date(Math.max(Date.now(), existing.updatedAt.getTime() + 1)),
        },
      })
      if (!updated.count) {
        throw new GrowthError(409, 'This evidence changed elsewhere. Reload before saving.')
      }
      return db.growthEvidence.findUniqueOrThrow({ where: { id } })
    })
    return NextResponse.json({ success: true, data: serializeEvidence(result) })
  } catch (error) {
    return growthFailure(error)
  }
})

export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').pop()!
    const deleted = await prisma.growthEvidence.deleteMany({ where: { id, userId: user.id } })
    if (!deleted.count) throw new GrowthError(404, 'Evidence not found')
    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    return growthFailure(error)
  }
})
