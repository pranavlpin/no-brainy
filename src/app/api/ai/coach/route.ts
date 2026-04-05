import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { getUserApiKey } from '@/lib/ai/get-api-key'
import { createOpenAIClient } from '@/lib/ai/openai-client'
import { coachPrompt } from '@/lib/ai/prompts/coach'
import { prisma } from '@/lib/prisma'
import type { CoachMessage } from '@/lib/ai/types'

export async function POST(req: NextRequest) {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  const apiKey = await getUserApiKey(user.id)
  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AI_NOT_CONFIGURED',
          message: 'OpenAI API key not configured. Add your key in Settings to use AI features.',
        },
      },
      { status: 403 }
    )
  }

  // Parse body
  const body = await req.json() as { messages: CoachMessage[]; context?: string }
  const { messages } = body

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'messages array is required' } },
      { status: 400 }
    )
  }

  // 2. Fetch user context
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [activeTasks, completedThisWeek, recentNotes, habits] = await Promise.all([
    prisma.task.findMany({
      where: { userId: user.id, status: { in: ['pending', 'in_progress'] } },
      select: { title: true, priority: true, status: true, dueDate: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.task.count({
      where: { userId: user.id, status: 'completed', completedAt: { gte: weekAgo } },
    }),
    prisma.note.findMany({
      where: { userId: user.id, isDeleted: false },
      select: { title: true, tags: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    }),
    prisma.habit.findMany({
      where: { userId: user.id },
      select: { title: true, frequency: true },
    }),
  ])

  // 3. Build system prompt
  const systemPrompt =
    coachPrompt.systemPrompt({
      userName: user.name || 'there',
      tasks: activeTasks.map((t) => ({
        title: t.title,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
      })),
      notes: recentNotes.map((n) => ({
        title: n.title,
        tags: n.tags,
        updatedAt: n.updatedAt,
      })),
      habits: habits.map((h) => ({
        title: h.title,
        frequency: h.frequency,
      })),
      timezone: user.timezone || 'UTC',
    }) + `\n\nAdditional context: User completed ${completedThisWeek} task(s) this week.`

  // 4. Create OpenAI client and stream
  const client = createOpenAIClient(apiKey)

  try {
    const stream = await client.chat.completions.create({
      model: coachPrompt.model,
      messages: [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ],
      stream: true,
      max_tokens: coachPrompt.maxTokens,
      temperature: coachPrompt.temperature,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Stream error'
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed'
    return NextResponse.json(
      { success: false, error: { code: 'AI_ERROR', message } },
      { status: 500 }
    )
  }
}
