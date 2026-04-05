'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'

export interface NotificationItem {
  id: string
  userId: string
  type: string
  title: string
  body: string
  relatedEntity: string | null
  relatedId: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

const NOTIFICATIONS_KEY = ['notifications'] as const
const UNREAD_COUNT_KEY = ['notifications', 'unread-count'] as const

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, { unreadOnly }],
    queryFn: () => {
      const params = new URLSearchParams()
      params.set('pageSize', '50')
      if (unreadOnly) params.set('unreadOnly', 'true')
      return apiClient<ApiResponse<PaginatedResponse<NotificationItem>>>(
        `/api/notifications?${params.toString()}`
      )
    },
    select: (res) => res.data,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: () =>
      apiClient<ApiResponse<{ unreadCount: number }>>('/api/notifications/count'),
    select: (res) => res.data.unreadCount,
    refetchInterval: 60000, // poll every 60 seconds
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<ApiResponse<{ id: string; isRead: boolean; readAt: string | null }>>(
        `/api/notifications/${id}/read`,
        { method: 'POST' }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
    },
  })
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiClient<ApiResponse<{ updated: number }>>('/api/notifications/read-all', {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
    },
  })
}

export function useGenerateNotifications() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiClient<ApiResponse<{ generated: number; notifications: string[] }>>(
        '/api/notifications/generate',
        { method: 'POST' }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
    },
  })
}
