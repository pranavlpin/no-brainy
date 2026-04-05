'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'
import type {
  StartQuizRequest,
  StartQuizResponse,
  SubmitAnswerRequest,
  QuizSessionResponse,
} from '@/lib/types/flashcards'

const QUIZ_KEY = ['quiz-sessions'] as const

export function useStartQuiz(deckId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: StartQuizRequest) => {
      const res = await apiClient<ApiResponse<StartQuizResponse>>(
        `/api/decks/${deckId}/quiz`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUIZ_KEY })
    },
  })
}

export function useSubmitAnswer(sessionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: SubmitAnswerRequest) => {
      const res = await apiClient<ApiResponse<QuizSessionResponse>>(
        `/api/quiz-sessions/${sessionId}/answer`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUIZ_KEY, sessionId] })
    },
  })
}

export function useCompleteQuiz(sessionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient<ApiResponse<QuizSessionResponse>>(
        `/api/quiz-sessions/${sessionId}/complete`,
        { method: 'POST' }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUIZ_KEY })
    },
  })
}
