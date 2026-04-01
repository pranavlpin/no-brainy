'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'

export interface LinkedEntityPreview {
  id: string
  targetType: string
  targetId: string
  createdAt: string
  title: string
  extra?: Record<string, unknown>
}

export interface TaskLinkedEntityPreview {
  taskId: string
  linkedType: string
  linkedId: string
  title: string
  extra?: Record<string, unknown>
}

const NOTE_LINKS_KEY = 'note-links' as const
const TASK_LINKS_KEY = 'task-links' as const

export function useNoteLinks(noteId: string) {
  return useQuery({
    queryKey: [NOTE_LINKS_KEY, noteId],
    queryFn: async () => {
      const res = await apiClient<ApiResponse<LinkedEntityPreview[]>>(
        `/api/notes/${noteId}/links`
      )
      return res.data
    },
    enabled: !!noteId,
  })
}

export function useAddNoteLink(noteId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ targetType, targetId }: { targetType: string; targetId: string }) => {
      const res = await apiClient<ApiResponse<{ id: string; sourceId: string; targetType: string; targetId: string; createdAt: string }>>(
        `/api/notes/${noteId}/links`,
        {
          method: 'POST',
          body: JSON.stringify({ targetType, targetId }),
        }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTE_LINKS_KEY, noteId] })
    },
  })
}

export function useRemoveNoteLink(noteId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ targetType, targetId }: { targetType: string; targetId: string }) => {
      await apiClient<ApiResponse<{ message: string }>>(
        `/api/notes/${noteId}/links`,
        {
          method: 'DELETE',
          body: JSON.stringify({ targetType, targetId }),
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTE_LINKS_KEY, noteId] })
    },
  })
}

export function useTaskLinks(taskId: string) {
  return useQuery({
    queryKey: [TASK_LINKS_KEY, taskId],
    queryFn: async () => {
      const res = await apiClient<ApiResponse<TaskLinkedEntityPreview[]>>(
        `/api/tasks/${taskId}/links`
      )
      return res.data
    },
    enabled: !!taskId,
  })
}

export function useAddTaskLink(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ linkedType, linkedId }: { linkedType: string; linkedId: string }) => {
      const res = await apiClient<ApiResponse<{ taskId: string; linkedType: string; linkedId: string }>>(
        `/api/tasks/${taskId}/links`,
        {
          method: 'POST',
          body: JSON.stringify({ linkedType, linkedId }),
        }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASK_LINKS_KEY, taskId] })
    },
  })
}

export function useRemoveTaskLink(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ linkedType, linkedId }: { linkedType: string; linkedId: string }) => {
      await apiClient<ApiResponse<{ message: string }>>(
        `/api/tasks/${taskId}/links`,
        {
          method: 'DELETE',
          body: JSON.stringify({ linkedType, linkedId }),
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASK_LINKS_KEY, taskId] })
    },
  })
}
