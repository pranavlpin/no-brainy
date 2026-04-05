'use client'

import { useAIAction } from '@/hooks/use-ai-action'
import type { AIActionResponse, TaskPrioritizationResult } from '@/lib/ai/types'

export function useTaskPrioritize() {
  return useAIAction<Record<string, never>, AIActionResponse<TaskPrioritizationResult>>(
    '/api/tasks/ai/prioritize'
  )
}
