import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAI } from '@/lib/ai/middleware'
import { callAI } from '@/lib/ai/call-ai'
import { handleAIError } from '@/lib/ai/error-handler'
import { reviewSummaryPrompt } from '@/lib/ai/prompts'
import type { ReviewSummary } from '@/lib/ai/types'

function extractDate(url: string): string {
  // /api/reviews/daily/[date]/ai/summary
  const segments = new URL(url).pathname.split('/')
  // segments: ['', 'api', 'reviews', 'daily', '<date>', 'ai', 'summary']
  return segments[4]
}

export const POST = withAI(async (req: NextRequest, { user, apiKey }) => {
  const dateStr = extractDate(req.url)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid date format. Use YYYY-MM-DD' },
      },
      { status: 400 }
    )
  }

  // Reject future dates
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  if (dateStr > todayStr) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Cannot generate summary for a future date' },
      },
      { status: 400 }
    )
  }

  const reviewDate = new Date(dateStr + 'T00:00:00.000Z')

  try {
    // Fetch or check existing review
    const review = await prisma.dailyReview.findUnique({
      where: {
        userId_reviewDate: {
          userId: user.id,
          reviewDate,
        },
      },
    })

    // Use review data if exists, otherwise use defaults
    const tasksCompleted = review?.tasksCompleted ?? 0
    const tasksMissed = review?.tasksMissed ?? 0
    const notesCreated = review?.notesCreated ?? 0
    const cardsReviewed = review?.cardsReviewed ?? 0
    const reflection = review?.reflectionMd || null
    const mood = review?.mood || null

    const result = await callAI<ReviewSummary>({
      apiKey,
      model: reviewSummaryPrompt.model,
      systemPrompt: reviewSummaryPrompt.systemPrompt,
      userPrompt: reviewSummaryPrompt.userPrompt({
        date: dateStr,
        tasksCompleted,
        tasksMissed,
        notesCreated,
        cardsReviewed,
        reflection,
        mood,
      }),
      maxTokens: reviewSummaryPrompt.maxTokens,
      temperature: reviewSummaryPrompt.temperature,
      responseFormat: 'json',
    })

    return NextResponse.json(result)
  } catch (error) {
    return handleAIError(error)
  }
})
