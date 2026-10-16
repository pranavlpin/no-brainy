'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'
import type {
  CaptureInput,
  CaptureResponse,
  CaptureState,
  ProcessCaptureInput,
} from '@/lib/types/inbox'

/** Fetch an explicit page of owned captures, preserving continuation metadata. */
export function useInbox(
  filters: { state?: CaptureState | 'all'; search?: string; page?: number; id?: string } = {}
) {
  const params = new URLSearchParams(
    Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)])
  )
  return useQuery({
    queryKey: ['inbox', filters],
    queryFn: () =>
      apiClient<ApiResponse<PaginatedResponse<CaptureResponse>>>(`/api/inbox?${params}`).then(
        (result) => result.data
      ),
  })
}
/** The owner/request ID uniqueness boundary protects retries even after a lost response. */
export function useCreateCapture() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: CaptureInput) =>
      apiClient<ApiResponse<CaptureResponse>>('/api/inbox', {
        method: 'POST',
        body: JSON.stringify(input),
      }).then((result) => result.data),
    onSuccess: () => client.invalidateQueries({ queryKey: ['inbox'] }),
  })
}
/** Convert atomically; a previously converted item returns its existing result. */
export function useProcessCapture() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: ProcessCaptureInput & { id: string }) =>
      apiClient<ApiResponse<CaptureResponse>>(`/api/inbox/${id}/process`, {
        method: 'POST',
        body: JSON.stringify(input),
      }).then((result) => result.data),
    onSuccess: () =>
      client.invalidateQueries({
        predicate: (query) =>
          ['inbox', 'tasks', 'notes', 'projects', 'bookmarks', 'planner', 'goals'].includes(
            String(query.queryKey[0])
          ),
      }),
  })
}
/** Reopen/archive without deleting the original text or an edited destination. */
export function useCaptureState() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, state }: { id: string; state: 'inbox' | 'someday' | 'archived' }) =>
      apiClient<ApiResponse<CaptureResponse>>(`/api/inbox/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ state }),
      }).then((result) => result.data),
    onSuccess: () => client.invalidateQueries({ queryKey: ['inbox'] }),
  })
}
