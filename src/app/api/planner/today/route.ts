import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { updateDayPlanSchema } from '@/lib/validations/planner'
import { dateFromKey, todayKey, userTimezone } from '@/lib/dates'
import { buildTodayPayload, getOrCreatePlan } from '@/lib/planner/today'

function internalError() {
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    { status: 500 }
  )
}

export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    const key = todayKey(userTimezone(user))
    const dayPlan = await getOrCreatePlan(user, key)
    return NextResponse.json({ success: true, data: await buildTodayPayload(user, key, dayPlan) })
  } catch (error) {
    console.error('[planner/today GET]', error)
    return internalError()
  }
})

export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const data = updateDayPlanSchema.parse(await req.json())
    const key = todayKey(userTimezone(user))
    const planDate = dateFromKey(key)

    if (data.focusTaskIds && data.focusTaskIds.length > 0) {
      const validTasks = await prisma.task.count({
        where: { id: { in: data.focusTaskIds }, userId: user.id },
      })
      if (validTasks !== data.focusTaskIds.length) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'One or more focus task IDs are invalid' },
          },
          { status: 400 }
        )
      }
    }

    const dayPlan = await prisma.dayPlan.upsert({
      where: { userId_planDate: { userId: user.id, planDate } },
      update: {
        ...(data.focusTaskIds !== undefined && { focusTaskIds: data.focusTaskIds }),
        ...(data.timeBlocks !== undefined && {
          timeBlocks: data.timeBlocks as unknown as Prisma.InputJsonValue,
        }),
        ...(data.aiBriefMd !== undefined && { aiBriefMd: data.aiBriefMd }),
        ...(data.intentMd !== undefined && { intentMd: data.intentMd }),
      },
      create: {
        userId: user.id,
        planDate,
        focusTaskIds: data.focusTaskIds ?? [],
        timeBlocks: (data.timeBlocks ?? []) as unknown as Prisma.InputJsonValue,
        aiBriefMd: data.aiBriefMd ?? null,
        intentMd: data.intentMd ?? null,
      },
    })

    return NextResponse.json({ success: true, data: await buildTodayPayload(user, key, dayPlan) })
  } catch (error) {
    if (error instanceof ZodError) {
      const details: Record<string, string[]> = {}
      for (const issue of error.issues) {
        const field = issue.path.join('.')
        if (!details[field]) details[field] = []
        details[field].push(issue.message)
      }
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details } },
        { status: 400 }
      )
    }
    console.error('[planner/today PUT]', error)
    return internalError()
  }
})
