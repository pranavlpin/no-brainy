'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'
import type {
  FinishSessionInput,
  FocusDayResponse,
  FocusKind,
  FocusSessionResponse,
} from '@/lib/types/focus'

export const FOCUS_KEY = ['focus-sessions'] as const

/** Sessions and total work minutes for a local day (defaults to today). */
export function useFocusSessions(date?: string) {
  return useQuery({
    queryKey: [...FOCUS_KEY, date ?? 'today'],
    queryFn: () =>
      apiClient<ApiResponse<FocusDayResponse>>(`/api/focus-sessions${date ? `?date=${date}` : ''}`),
    select: (res) => res.data,
    staleTime: 30_000,
  })
}

export function useStartFocusSession() {
  return useMutation({
    mutationFn: (body: { taskId?: string | null; kind: FocusKind; intention?: string }) =>
      apiClient<ApiResponse<FocusSessionResponse>>('/api/focus-sessions', {
        method: 'POST',
        body: JSON.stringify(body),
      }).then((r) => r.data),
  })
}

export function useEndFocusSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: { id: string; completed?: boolean } & Partial<FinishSessionInput>) =>
      apiClient<ApiResponse<FocusSessionResponse>>(`/api/focus-sessions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }).then((r) => r.data),
    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: [...FOCUS_KEY] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
      if (vars.outcome) {
        // A result may complete the task or create a next action.
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
        queryClient.invalidateQueries({ queryKey: ['planner'] })
        queryClient.invalidateQueries({ queryKey: ['goals'] })
      }
    },
  })
}
