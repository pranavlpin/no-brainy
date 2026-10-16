import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { addCalendarDays, todayInTimezone } from '@/lib/dates/calendar'
import { serializeTask } from '@/lib/tasks/serialize'
import { dateParamSchema } from '@/lib/validations/planner'
import { plannerFailure } from '@/lib/planner/server'

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const date = req.nextUrl.searchParams.get('before')
      ? dateParamSchema.parse(req.nextUrl.searchParams.get('before'))
      : todayInTimezone(user.timezone)
    const before = new Date(`${date}T00:00:00Z`)
    const prior = await prisma.dayPlan.findMany({
      where: { userId: user.id, planDate: { lt: before } },
      select: { focusTaskIds: true, growthTaskId: true },
    })
    const priorIds = [
      ...new Set(
        prior.flatMap((plan) => [
          ...plan.focusTaskIds,
          ...(plan.growthTaskId ? [plan.growthTaskId] : []),
        ])
      ),
    ]
    const suggestions = await prisma.task.findMany({
      where: {
        userId: user.id,
        status: { in: ['pending', 'in_progress'] },
        routinePaused: false,
        AND: [
          { OR: [{ plannedDate: null }, { plannedDate: { lt: before } }] },
          {
            OR: [
              { plannedDate: { lt: before } },
              { dueDate: { lt: before } },
              { id: { in: priorIds } },
            ],
          },
        ],
      },
      orderBy: [{ plannedDate: 'asc' }, { createdAt: 'asc' }],
    })
    return NextResponse.json({
      success: true,
      data: {
        suggestions: suggestions.map(serializeTask),
        yesterdayDate: addCalendarDays(date, -1),
        beforeDate: date,
      },
    })
  } catch (error) {
    return plannerFailure(error)
  }
})
