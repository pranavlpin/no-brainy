import { NextRequest, NextResponse } from 'next/server'
import { readDaily } from '@/lib/reviews/server'
import { validateAIOutput } from '@/lib/ai/validation'
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

  try {
    const review = await readDaily(user, dateStr)
    const { tasksCompleted, tasksMissed, notesCreated, cardsReviewed, mood } = review
    const reflection =
      [review.whatMoved, review.blockers, review.reflectionMd].filter(Boolean).join('\n') || null
    const result = await callAI<ReviewSummary>({
      apiKey,
      model: reviewSummaryPrompt.model,
      systemPrompt: reviewSummaryPrompt.systemPrompt,
      userPrompt:
        reviewSummaryPrompt.userPrompt({
          date: dateStr,
          tasksCompleted,
          tasksMissed,
          notesCreated,
          cardsReviewed,
          reflection,
          mood,
        }) +
        `\nRecorded focus outcomes (not diagnoses): ${JSON.stringify(review.activity.focusSessions.map((s) => ({ id: s.id, completedAt: s.completedAt, outcome: s.outcome, reflection: s.reflection, seconds: s.accumulatedSeconds })))}`,
      maxTokens: reviewSummaryPrompt.maxTokens,
      temperature: reviewSummaryPrompt.temperature,
      responseFormat: 'json',
    })

    return NextResponse.json({ ...result, data: validateAIOutput('recap', result.data) })
  } catch (error) {
    return handleAIError(error)
  }
})
