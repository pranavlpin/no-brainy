'use client'

import { useAIAction } from './use-ai-action'
import type { AIActionResponse, ReviewSummary } from '@/lib/ai/types'

export function useReviewAISummary(date: string) {
  return useAIAction<void, AIActionResponse<ReviewSummary>>(
    `/api/reviews/daily/${date}/ai/summary`
  )
}
