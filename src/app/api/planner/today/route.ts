import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { todayInTimezone } from '@/lib/dates/calendar'
import { readDayPlan, saveDayPlan, plannerFailure } from '@/lib/planner/server'

export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    return NextResponse.json({
      success: true,
      data: await readDayPlan(prisma, user.id, todayInTimezone(user.timezone)),
    })
  } catch (error) {
    return plannerFailure(error)
  }
})
export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    return await saveDayPlan(user, todayInTimezone(user.timezone), await req.json())
  } catch (error) {
    return plannerFailure(error)
  }
})
