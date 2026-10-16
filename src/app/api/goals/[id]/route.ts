import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { updateGoalSchema } from '@/lib/validations/goals'
import {
  checkExpenseCategory,
  goalDates,
  goalInclude,
  GrowthError,
  growthFailure,
  serializeGoal,
} from '@/lib/growth/server'
const idFrom = (req: NextRequest) => req.nextUrl.pathname.split('/').at(-1)!
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const goal = await prisma.goal.findFirst({
      where: { id: idFrom(req), userId: user.id },
      include: goalInclude,
    })
    if (!goal) throw new GrowthError(404, 'Goal not found')
    return NextResponse.json({ success: true, data: await serializeGoal(goal) })
  } catch (error) {
    return growthFailure(error)
  }
})
export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const id = idFrom(req)
    const { expectedUpdatedAt, ...input } = updateGoalSchema.parse(await req.json())
    const existing = await prisma.goal.findFirst({ where: { id, userId: user.id } })
    if (!existing) throw new GrowthError(404, 'Goal not found')
    await checkExpenseCategory(user.id, input.expenseCategoryId)
    const goal = await prisma.$transaction(async (db) => {
      const updated = await db.goal.updateMany({
        where: {
          id,
          userId: user.id,
          ...(expectedUpdatedAt && { updatedAt: new Date(expectedUpdatedAt) }),
        },
        data: {
          ...goalDates(input),
          updatedAt: new Date(Math.max(Date.now(), existing.updatedAt.getTime() + 1)),
        },
      })
      if (!updated.count)
        throw new GrowthError(
          409,
          'This goal changed elsewhere. Refresh it before saving your edits.'
        )
      return db.goal.findUniqueOrThrow({ where: { id }, include: goalInclude })
    })
    return NextResponse.json({ success: true, data: await serializeGoal(goal) })
  } catch (error) {
    return growthFailure(error)
  }
})
export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const deleted = await prisma.goal.deleteMany({ where: { id: idFrom(req), userId: user.id } })
    if (!deleted.count) throw new GrowthError(404, 'Goal not found')
    return NextResponse.json({ success: true, data: { id: idFrom(req) } })
  } catch (error) {
    return growthFailure(error)
  }
})
