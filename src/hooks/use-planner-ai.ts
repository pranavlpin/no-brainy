'use client'

import { useAIAction } from './use-ai-action'
import type { AIActionResponse, DailyPlanSuggestion } from '@/lib/ai/types'

export function usePlannerAISuggest() {
  return useAIAction<void, AIActionResponse<DailyPlanSuggestion>>(
    '/api/planner/ai/suggest'
  )
}
