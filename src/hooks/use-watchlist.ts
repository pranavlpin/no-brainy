'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type {
  WatchlistItemResponse,
  CreateWatchlistRequest,
  UpdateWatchlistRequest,
  WatchlistFilters,
} from '@/lib/types/watchlist'
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'

const WATCHLIST_KEY = ['watchlist']

function buildQueryString(filters?: WatchlistFilters): string {
  if (!filters) return ''
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.type) params.set('type', filters.type)
  if (filters.status) params.set('status', filters.status)
  if (filters.genre) {
    filters.genre.forEach((g) => params.append('genre', g))
  }
  if (filters.tags) {
    filters.tags.forEach((t) => params.append('tags', t))
  }
  if (filters.sortBy) params.set('sortBy', filters.sortBy)
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function useWatchlist(filters?: WatchlistFilters) {
  return useQuery({
    queryKey: [...WATCHLIST_KEY, filters],
    queryFn: () =>
      apiClient<ApiResponse<PaginatedResponse<WatchlistItemResponse>>>(
        `/api/watchlist${buildQueryString(filters)}`
      ).then((res) => res.data.items),
  })
}

export function useWatchlistItem(id: string) {
  return useQuery({
    queryKey: [...WATCHLIST_KEY, id],
    queryFn: () =>
      apiClient<ApiResponse<WatchlistItemResponse>>(`/api/watchlist/${id}`).then(
        (res) => res.data
      ),
    enabled: !!id,
  })
}

export function useCreateWatchlistItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateWatchlistRequest) =>
      apiClient<ApiResponse<WatchlistItemResponse>>('/api/watchlist', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEY })
    },
  })
}

export function useUpdateWatchlistItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWatchlistRequest }) =>
      apiClient<ApiResponse<WatchlistItemResponse>>(`/api/watchlist/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then((res) => res.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEY })
      queryClient.invalidateQueries({ queryKey: [...WATCHLIST_KEY, variables.id] })
    },
  })
}

export function useDeleteWatchlistItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<ApiResponse<null>>(`/api/watchlist/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEY })
    },
  })
}
