import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { createGoalSchema, goalQuerySchema } from '@/lib/validations/goals'
import {
  checkExpenseCategory,
  goalDates,
  goalInclude,
  growthFailure,
  serializeGoal,
} from '@/lib/growth/server'
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const input = goalQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    const where = {
      userId: user.id,
      ...(input.status && { status: input.status }),
      ...(input.category && { category: input.category }),
    }
    const [goals, total] = await Promise.all([
      prisma.goal.findMany({
        where,
        orderBy: [{ [input.sortBy]: input.sortOrder }, { id: 'asc' }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: goalInclude,
      }),
      prisma.goal.count({ where }),
    ])
    return NextResponse.json({
      success: true,
      data: {
        items: await Promise.all(goals.map(serializeGoal)),
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
    const input = createGoalSchema.parse(await req.json())
    await checkExpenseCategory(user.id, input.expenseCategoryId)
    const goal = await prisma.goal.create({
      data: { ...goalDates(input), userId: user.id },
      include: goalInclude,
    })
    return NextResponse.json({ success: true, data: await serializeGoal(goal) }, { status: 201 })
  } catch (error) {
    return growthFailure(error)
  }
})
