import { NextResponse } from 'next/server'
import { z } from 'zod'
import { todayInTimezone, calendarDate } from '@/lib/dates/calendar'
import { prisma } from '@/lib/prisma'
import { withAI } from '@/lib/ai/middleware'
import { callAI } from '@/lib/ai/call-ai'
import { handleAIError } from '@/lib/ai/error-handler'
import { dailyPlanSuggestPrompt } from '@/lib/ai/prompts'
import { validatePlan } from '@/lib/ai/validation'
import { planCapacity } from '@/lib/planner/capacity'
import type { TimeBlock } from '@/lib/types/planner'
export const POST = withAI(async (req, { user, apiKey, preferredModel }) => {
  try {
    const input = z
      .object({
        date: z
          .string()
          .refine((v) => calendarDate(v) === v)
          .optional(),
      })
      .parse(await req.json().catch(() => ({})))
    const date = input.date ?? todayInTimezone(user.timezone)
    const [tasks, plan] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId: user.id,
          status: { in: ['pending', 'in_progress'] },
          routinePaused: false,
          OR: [{ goalId: null }, { goal: { status: 'active' } }],
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      }),
      prisma.dayPlan.findUnique({
        where: { userId_planDate: { userId: user.id, planDate: new Date(date) } },
      }),
    ])
    if (!tasks.length)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_TASKS',
            message: 'Add an active action first, or plan your day manually.',
          },
        },
        { status: 400 }
      )
    const ranked = [...tasks].sort((a, b) => {
      const ranks = { urgent: 0, high: 1, medium: 2, low: 3 }
      return (
        (a.plannedDate?.toISOString().slice(0, 10) === date ? -1 : 0) -
        (b.plannedDate?.toISOString().slice(0, 10) === date ? -1 : 0) +
        (ranks[a.priority as keyof typeof ranks] ?? 4) -
        (ranks[b.priority as keyof typeof ranks] ?? 4)
      )
    })
    const candidates = ranked.slice(0, 100)
    const result = await callAI<unknown>({
      apiKey,
      model: preferredModel ?? dailyPlanSuggestPrompt.model,
      systemPrompt: dailyPlanSuggestPrompt.systemPrompt,
      userPrompt:
        dailyPlanSuggestPrompt.userPrompt({
          today: date,
          existingPlanTaskIds: plan?.focusTaskIds ?? [],
          tasks: candidates.map((t) => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            status: t.status,
            dueDate: t.dueDate?.toISOString().slice(0, 10) ?? null,
          })),
        }) +
        `\nPlan capacity and current commitments: ${JSON.stringify({ availableMinutes: plan?.availableMinutes ?? 180, bufferMinutes: plan?.bufferMinutes ?? 15, mainOutcome: plan?.mainOutcome ?? '', timeBlocks: plan?.timeBlocks ?? [], actions: candidates.map((t) => ({ id: t.id, estimatedMinutes: t.estimatedMinutes, plannedDate: t.plannedDate?.toISOString().slice(0, 10) ?? null, goalId: t.goalId, projectId: t.projectId })) })}`,
      maxTokens: dailyPlanSuggestPrompt.maxTokens,
      temperature: dailyPlanSuggestPrompt.temperature,
      responseFormat: 'json',
    })
    const parsed = validatePlan(result.data, new Set(candidates.map((t) => t.id)))
    const sources = parsed.suggestedTaskIds.map((id) => {
      const task = candidates.find((t) => t.id === id)!
      return {
        id: task.id,
        title: task.title,
        estimatedMinutes: task.estimatedMinutes,
        dueDate: task.dueDate?.toISOString().slice(0, 10) ?? null,
        plannedDate: task.plannedDate?.toISOString().slice(0, 10) ?? null,
      }
    })
    const commitments = tasks.filter(
      (t) =>
        parsed.suggestedTaskIds.includes(t.id) || t.plannedDate?.toISOString().slice(0, 10) === date
    )
    const capacity = planCapacity({
      tasks: commitments,
      blocks: (plan?.timeBlocks ?? []) as unknown as TimeBlock[],
      availableMinutes: plan?.availableMinutes ?? 180,
      bufferMinutes: plan?.bufferMinutes ?? 15,
      workStart: plan?.workStart,
      workEnd: plan?.workEnd,
    })
    const warnings = [
      ...(capacity.overBy
        ? [
            `This would exceed your ${capacity.availableMinutes}-minute capacity by ${capacity.overBy} minutes.`,
          ]
        : []),
      ...(capacity.unknownTaskIds.length
        ? [`${capacity.unknownTaskIds.length} actions have no estimate; fit is uncertain.`]
        : []),
      ...(capacity.overlaps.length ? ['Some planned time blocks overlap.'] : []),
    ]
    return NextResponse.json({ ...result, data: { ...parsed, planDate: date, sources, warnings } })
  } catch (error) {
    return handleAIError(error)
  }
})
