'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type {
  BookResponse,
  CreateBookRequest,
  UpdateBookRequest,
  BookFilters,
} from '@/lib/types/books'
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'

const BOOKS_KEY = ['books']

function buildQueryString(filters?: BookFilters): string {
  if (!filters) return ''
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
    statuses.forEach((s) => params.append('status', s))
  }
  if (filters.genre) {
    filters.genre.forEach((g) => params.append('genre', g))
  }
  if (filters.hasRating !== undefined) params.set('hasRating', String(filters.hasRating))
  if (filters.sortBy) params.set('sortBy', filters.sortBy)
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function useBooks(filters?: BookFilters) {
  return useQuery({
    queryKey: [...BOOKS_KEY, filters],
    queryFn: () =>
      apiClient<ApiResponse<PaginatedResponse<BookResponse>>>(
        `/api/books${buildQueryString(filters)}`
      ).then((res) => res.data.items),
  })
}

export function useBook(id: string) {
  return useQuery({
    queryKey: [...BOOKS_KEY, id],
    queryFn: () =>
      apiClient<ApiResponse<BookResponse>>(`/api/books/${id}`).then(
        (res) => res.data
      ),
    enabled: !!id,
  })
}

export function useCreateBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateBookRequest) =>
      apiClient<ApiResponse<BookResponse>>('/api/books', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKS_KEY })
    },
  })
}

export function useUpdateBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBookRequest }) =>
      apiClient<ApiResponse<BookResponse>>(`/api/books/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then((res) => res.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: BOOKS_KEY })
      queryClient.invalidateQueries({ queryKey: [...BOOKS_KEY, variables.id] })
    },
  })
}

export function useDeleteBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<ApiResponse<null>>(`/api/books/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKS_KEY })
    },
  })
}
