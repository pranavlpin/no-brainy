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

    const today = new Date().toISOString().split('T')[0]

    const result = await callAI<TaskPrioritizationResult>({
      apiKey: ctx.apiKey,
      model: taskPrioritizePrompt.model,
      systemPrompt: taskPrioritizePrompt.systemPrompt,
      userPrompt: taskPrioritizePrompt.userPrompt({ tasks: taskList, today }),
      maxTokens: taskPrioritizePrompt.maxTokens,
      temperature: taskPrioritizePrompt.temperature,
      responseFormat: 'json',
    })

    // Enrich suggestions with task titles for display
    const titleMap = new Map(taskList.map((t) => [t.id, t.title]))
    result.data.suggestions = result.data.suggestions.map((s) => ({
      ...s,
      taskTitle: titleMap.get(s.taskId) ?? s.taskId,
    }))

    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json(
      {
        success: false,
        error: { code: 'AI_ERROR', message },
      },
      { status: 500 }
    )
  }
})
