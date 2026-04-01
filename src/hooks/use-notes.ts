'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { NoteResponse, CreateNoteRequest, UpdateNoteRequest, NoteFilters } from '@/lib/types/notes'
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'

const NOTES_KEY = ['notes'] as const

export function useNotes(filters?: NoteFilters) {
  return useQuery({
    queryKey: [...NOTES_KEY, 'list', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.search) params.set('search', filters.search)
      if (filters?.tags?.length) params.set('tags', filters.tags.join(','))
      if (filters?.isPinned !== undefined) params.set('isPinned', String(filters.isPinned))
      if (filters?.sortBy) params.set('sortBy', filters.sortBy)
      if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder)
      const qs = params.toString()
      const url = `/api/notes${qs ? `?${qs}` : ''}`
      const res = await apiClient<ApiResponse<PaginatedResponse<NoteResponse>>>(url)
      return res.data
    },
  })
}

export function useNote(id: string) {
  return useQuery({
    queryKey: [...NOTES_KEY, 'detail', id],
    queryFn: async () => {
      const res = await apiClient<ApiResponse<NoteResponse>>(`/api/notes/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateNoteRequest) => {
      const res = await apiClient<ApiResponse<NoteResponse>>('/api/notes', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_KEY })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateNoteRequest & { id: string }) => {
      const res = await apiClient<ApiResponse<NoteResponse>>(`/api/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...NOTES_KEY, 'detail', data.id], data)
      queryClient.invalidateQueries({ queryKey: [...NOTES_KEY, 'list'] })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient<ApiResponse<{ message: string }>>(`/api/notes/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_KEY })
    },
  })
}

export function useRestoreNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient<ApiResponse<NoteResponse>>(`/api/notes/${id}/restore`, {
        method: 'POST',
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_KEY })
    },
  })
}

export function useSearchNotes(query: string) {
  return useQuery({
    queryKey: [...NOTES_KEY, 'search', query],
    queryFn: async () => {
      const res = await apiClient<ApiResponse<NoteResponse[]>>(
        `/api/notes/search?q=${encodeURIComponent(query)}`
      )
      return res.data
    },
    enabled: query.length > 0,
  })
}
