'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'
import type {
  CaptureFilters,
  CaptureInput,
  CaptureResponse,
  ProcessCaptureInput,
} from '@/lib/types/inbox'

export const INBOX_KEY = ['inbox'] as const

/** Caches whose contents a processed capture may have changed. */
const DESTINATION_KEYS = ['inbox', 'tasks', 'notes', 'bookmarks', 'planner', 'home', 'nav']

function invalidateDestinations(client: ReturnType<typeof useQueryClient>) {
  client.invalidateQueries({
    predicate: (query) => DESTINATION_KEYS.includes(String(query.queryKey[0])),
  })
}

/** One page of captures with its pagination metadata. */
export function useInbox(filters: CaptureFilters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)])
  )
  const qs = params.toString()
  return useQuery({
    queryKey: [...INBOX_KEY, filters],
    queryFn: () =>
      apiClient<ApiResponse<PaginatedResponse<CaptureResponse>>>(`/api/inbox${qs ? `?${qs}` : ''}`),
    select: (res) => res.data,
    placeholderData: (previous) => previous,
  })
}

/** Create a capture; the client request id makes retries safe. */
export function useCreateCapture() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: CaptureInput) =>
      apiClient<ApiResponse<CaptureResponse>>('/api/inbox', {
        method: 'POST',
        body: JSON.stringify(input),
      }).then((res) => res.data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [...INBOX_KEY] })
      client.invalidateQueries({ queryKey: ['nav'] })
    },
  })
}

/** Convert atomically; an already converted capture returns its existing result. */
export function useProcessCapture() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: ProcessCaptureInput & { id: string }) =>
      apiClient<ApiResponse<CaptureResponse>>(`/api/inbox/${id}/process`, {
        method: 'POST',
        body: JSON.stringify(input),
      }).then((res) => res.data),
    onSuccess: () => invalidateDestinations(client),
  })
}

/** Reverse a conversion: removes what it created and reopens the capture. */
export function useUndoCapture() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<ApiResponse<CaptureResponse>>(`/api/inbox/${id}/undo`, { method: 'POST' }).then(
        (res) => res.data
      ),
    onSuccess: () => invalidateDestinations(client),
  })
}

/** Move between inbox, someday, and archived without deleting the text. */
export function useCaptureState() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, state }: { id: string; state: 'inbox' | 'someday' | 'archived' }) =>
      apiClient<ApiResponse<CaptureResponse>>(`/api/inbox/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ state }),
      }).then((res) => res.data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [...INBOX_KEY] })
      client.invalidateQueries({ queryKey: ['nav'] })
    },
  })
}
