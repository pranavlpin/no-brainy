'use client'

import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

interface AIErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'error' in error) {
    const errResp = error as AIErrorResponse
    return errResp.error?.message || 'An error occurred with the AI request.'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred.'
}

/**
 * Generic hook for AI actions. POSTs to the given endpoint,
 * handles loading/error states, and shows toast on error.
 */
export function useAIAction<TInput, TOutput>(endpoint: string) {
  const toast = useToast()

  return useMutation<TOutput, unknown, TInput>({
    mutationFn: (input: TInput) =>
      apiClient<TOutput>(endpoint, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onError: (error) => {
      toast.show(getErrorMessage(error), 'error')
    },
  })
}
