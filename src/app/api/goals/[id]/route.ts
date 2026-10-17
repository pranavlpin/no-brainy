import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { userTimezone } from '@/lib/dates'
import { updateGoalSchema } from '@/lib/validations/goals'
import {
  goalInclude,
  goalWriteData,
  practiceCountsForGoals,
  serializeGoal,
} from '@/lib/goals/serialize'

function extractId(url: string): string {
  const segments = new URL(url).pathname.split('/')
  return segments[segments.length - 1]
}

const notFound = () =>
  NextResponse.json(
    { success: false, error: { code: 'NOT_FOUND', message: 'Goal not found' } },
    { status: 404 }
  )

const internalError = () =>
  NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    { status: 500 }
  )

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const id = extractId(req.url)
    const goal = await prisma.goal.findFirst({
      where: { id, userId: user.id },
      include: goalInclude,
    })
    if (!goal) return notFound()
    const practice = await practiceCountsForGoals(user.id, [goal.id], userTimezone(user))
    return NextResponse.json({
      success: true,
      data: await serializeGoal(goal, practice.get(goal.id) ?? 0),
    })
  } catch (error) {
    console.error('[goals/[id] GET]', error)
    return internalError()
  }
})

export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const id = extractId(req.url)
    const data = updateGoalSchema.parse(await req.json())
    const existing = await prisma.goal.findFirst({ where: { id, userId: user.id } })
    if (!existing) return notFound()

    const goal = await prisma.goal.update({
      where: { id },
      data: goalWriteData(data),
      include: goalInclude,
    })
    const practice = await practiceCountsForGoals(user.id, [goal.id], userTimezone(user))
    return NextResponse.json({
      success: true,
      data: await serializeGoal(goal, practice.get(goal.id) ?? 0),
    })
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
    console.error('[goals/[id] PATCH]', error)
    return internalError()
  }
})

export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const id = extractId(req.url)
    const existing = await prisma.goal.findFirst({ where: { id, userId: user.id } })
    if (!existing) return notFound()
    await prisma.goal.delete({ where: { id } })
    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    console.error('[goals/[id] DELETE]', error)
    return internalError()
  }
})
