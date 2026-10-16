import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { dateParamSchema } from '@/lib/validations/planner'
import { readDayPlan, saveDayPlan, plannerFailure } from '@/lib/planner/server'

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const date = dateParamSchema.parse(req.nextUrl.pathname.split('/').pop())
    return NextResponse.json({ success: true, data: await readDayPlan(prisma, user.id, date) })
  } catch (error) {
    return plannerFailure(error)
  }
})
export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const date = dateParamSchema.parse(req.nextUrl.pathname.split('/').pop())
    return await saveDayPlan(user, date, await req.json())
  } catch (error) {
    return plannerFailure(error)
  }
})
