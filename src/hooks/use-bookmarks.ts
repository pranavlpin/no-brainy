'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type {
  BookmarkResponse,
  CreateBookmarkRequest,
  UpdateBookmarkRequest,
  BookmarkFilters,
} from '@/lib/types/bookmarks'
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'

const BOOKMARKS_KEY = ['bookmarks']

function buildQueryString(filters?: BookmarkFilters): string {
  if (!filters) return ''
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.tags) {
    filters.tags.forEach((t) => params.append('tags', t))
  }
  if (filters.isPinned !== undefined) params.set('isPinned', String(filters.isPinned))
  if (filters.sortBy) params.set('sortBy', filters.sortBy)
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function useBookmarks(filters?: BookmarkFilters) {
  return useQuery({
    queryKey: [...BOOKMARKS_KEY, filters],
    queryFn: () =>
      apiClient<ApiResponse<PaginatedResponse<BookmarkResponse>>>(
        `/api/bookmarks${buildQueryString(filters)}`
      ).then((res) => res.data.items),
  })
}

export function useBookmark(id: string) {
  return useQuery({
    queryKey: [...BOOKMARKS_KEY, id],
    queryFn: () =>
      apiClient<ApiResponse<BookmarkResponse>>(`/api/bookmarks/${id}`).then(
        (res) => res.data
      ),
    enabled: !!id,
  })
}

export function useCreateBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateBookmarkRequest) =>
      apiClient<ApiResponse<BookmarkResponse>>('/api/bookmarks', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKMARKS_KEY })
    },
  })
}

export function useUpdateBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBookmarkRequest }) =>
      apiClient<ApiResponse<BookmarkResponse>>(`/api/bookmarks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then((res) => res.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: BOOKMARKS_KEY })
      queryClient.invalidateQueries({ queryKey: [...BOOKMARKS_KEY, variables.id] })
    },
  })
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<ApiResponse<null>>(`/api/bookmarks/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKMARKS_KEY })
    },
  })
}
