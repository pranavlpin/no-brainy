import { NextResponse } from 'next/server'
import { withAI } from '@/lib/ai/middleware'
import { createOpenAIClient } from '@/lib/ai/openai-client'
import { coachPrompt } from '@/lib/ai/prompts/coach'
import { handleAIError } from '@/lib/ai/error-handler'
import { aggregateUserData } from '@/lib/ai/insights/aggregate-user-data'
import { coachInputSchema } from '@/lib/ai/validation'
import { prisma } from '@/lib/prisma'
import { todayInTimezone } from '@/lib/dates/calendar'
import { weekStartFor } from '@/lib/growth/progress'
export const POST = withAI(async (req, { user, apiKey, preferredModel }) => {
  try {
    const { messages, context } = coachInputSchema.parse(await req.json())
    const today = todayInTimezone(user.timezone)
    const [tasks, notes, plan, review, data] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId: user.id,
          status: { in: ['pending', 'in_progress'] },
          routinePaused: false,
          OR: [{ goalId: null }, { goal: { status: 'active' } }],
        },
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        take: 20,
      }),
      prisma.note.findMany({
        where: { userId: user.id, isDeleted: false },
        orderBy: { updatedAt: 'desc' },
        take: 3,
      }),
      prisma.dayPlan.findUnique({
        where: { userId_planDate: { userId: user.id, planDate: new Date(today) } },
      }),
      prisma.dailyReview.findUnique({
        where: { userId_reviewDate: { userId: user.id, reviewDate: new Date(today) } },
      }),
      aggregateUserData(
        user.id,
        context?.modules ?? ['tasks', 'goals', 'notes'],
        context?.dateFrom ?? weekStartFor(today),
        context?.dateTo ?? today
      ),
    ])
    const systemPrompt =
      coachPrompt.systemPrompt({
        userName: user.name || 'there',
        tasks,
        notes,
        habits: [],
        timezone: user.timezone,
      }) +
      `\nSelected bounded evidence: ${JSON.stringify(data)}\nCurrent plan snapshot: ${JSON.stringify(plan ? { date: today, mainOutcome: plan.mainOutcome, availableMinutes: plan.availableMinutes, bufferMinutes: plan.bufferMinutes, focusTaskIds: plan.focusTaskIds } : null)}\nCurrent reflection: ${JSON.stringify(review ? { date: today, whatMoved: review.whatMoved, blockers: review.blockers, tomorrowTaskId: review.tomorrowTaskId } : null)}\nActive action references: ${JSON.stringify(tasks.map((t) => ({ id: t.id, title: t.title, estimatedMinutes: t.estimatedMinutes, plannedDate: t.plannedDate, goalId: t.goalId, projectId: t.projectId })))}`
    const stream = await createOpenAIClient(apiKey).chat.completions.create(
      {
        model: preferredModel ?? coachPrompt.model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        stream: true,
        max_tokens: coachPrompt.maxTokens,
        temperature: coachPrompt.temperature,
      },
      { signal: req.signal }
    )
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content
            if (content)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch {
          try {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: 'The response stopped. Retry when ready; your workspace is unchanged.' })}\n\n`
              )
            )
            controller.close()
          } catch {
            /* The reader disconnected. */
          }
        }
      },
      cancel() {
        stream.controller.abort()
      },
    })
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    return handleAIError(error)
  }
})
