import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAI } from '@/lib/ai/middleware'
import { callAI } from '@/lib/ai/call-ai'
import { handleAIError } from '@/lib/ai/error-handler'
import { dailyPlanSuggestPrompt } from '@/lib/ai/prompts'
import type { DailyPlanSuggestion } from '@/lib/ai/types'

function getTodayDate(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

export const POST = withAI(async (_req: NextRequest, { user, apiKey }) => {
  try {
    // Fetch active tasks (pending + in_progress, limit 50)
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        status: { in: ['pending', 'in_progress'] },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      take: 50,
    })

    if (tasks.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_TASKS',
            message: 'You have no active tasks. Create some tasks first to get AI suggestions.',
          },
        },
        { status: 400 }
      )
    }

    // Fetch today's plan to know what's already planned
    const today = getTodayDate()
    const existingPlan = await prisma.dayPlan.findUnique({
      where: {
        userId_planDate: {
          userId: user.id,
          planDate: today,
        },
      },
    })

    const todayStr = today.toISOString().split('T')[0]

    const result = await callAI<DailyPlanSuggestion>({
      apiKey,
      model: dailyPlanSuggestPrompt.model,
      systemPrompt: dailyPlanSuggestPrompt.systemPrompt,
      userPrompt: dailyPlanSuggestPrompt.userPrompt({
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status,
          dueDate: t.dueDate?.toISOString().split('T')[0] ?? null,
        })),
        today: todayStr,
        existingPlanTaskIds: existingPlan?.focusTaskIds ?? [],
      }),
      maxTokens: dailyPlanSuggestPrompt.maxTokens,
      temperature: dailyPlanSuggestPrompt.temperature,
      responseFormat: 'json',
    })

    return NextResponse.json(result)
  } catch (error) {
    return handleAIError(error)
  }
})
