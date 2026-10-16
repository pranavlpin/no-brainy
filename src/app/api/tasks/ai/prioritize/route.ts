import { validateAIOutput } from '@/lib/ai/validation'
import { AIError } from '@/lib/ai/call-ai'
import { handleAIError } from '@/lib/ai/error-handler'
import { todayInTimezone } from '@/lib/dates/calendar'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAI } from '@/lib/ai/middleware'
import { callAI } from '@/lib/ai/call-ai'
import { taskPrioritizePrompt } from '@/lib/ai/prompts/task-prioritize'
import type { TaskPrioritizationResult } from '@/lib/ai/types'

export const POST = withAI(async (_req: NextRequest, ctx) => {
  try {
    // Fetch all non-completed, non-cancelled tasks for user (limit 50)
    const tasks = await prisma.task.findMany({
      where: {
        userId: ctx.user.id,
        status: { in: ['pending', 'in_progress'] },
        routinePaused: false,
        OR: [{ goalId: null }, { goal: { status: 'active' } }],
      },
      orderBy: { orderIndex: 'asc' },
      take: 50,
      select: {
        id: true,
        title: true,
        descriptionMd: true,
        priority: true,
        status: true,
        dueDate: true,
        tags: true,
      },
    })

    if (tasks.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          suggestions: [],
          reasoning: 'No active tasks found to prioritize.',
        },
        model: taskPrioritizePrompt.model,
      })
    }

    const taskList = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.descriptionMd || '',
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate?.toISOString().split('T')[0] ?? null,
    }))

    const today = todayInTimezone(ctx.user.timezone)

    const result = await callAI<TaskPrioritizationResult>({
      apiKey: ctx.apiKey,
      model: taskPrioritizePrompt.model,
      systemPrompt: taskPrioritizePrompt.systemPrompt,
      userPrompt: taskPrioritizePrompt.userPrompt({ tasks: taskList, today }),
      maxTokens: taskPrioritizePrompt.maxTokens,
      temperature: taskPrioritizePrompt.temperature,
      responseFormat: 'json',
    })

    result.data = validateAIOutput('priorities', result.data)
    if (
      new Set(result.data.suggestions.map((s) => s.taskId)).size !==
        result.data.suggestions.length ||
      result.data.suggestions.some((s) => !tasks.some((t) => t.id === s.taskId))
    )
      throw new AIError(
        'Some suggested tasks are unavailable. Regenerate when ready.',
        'AI_INVALID_RESPONSE'
      )
    // Enrich suggestions with task titles for display
    const titleMap = new Map(taskList.map((t) => [t.id, t.title]))
    result.data.suggestions = result.data.suggestions.map((s) => ({
      ...s,
      taskTitle: titleMap.get(s.taskId)!,
      currentPriority: tasks.find((t) => t.id === s.taskId)!.priority,
    }))

    return NextResponse.json(result)
  } catch (error) {
    return handleAIError(error)
  }
})
