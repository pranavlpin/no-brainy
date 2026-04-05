'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'

const API_KEY_QUERY_KEY = ['settings', 'api-key'] as const

interface ApiKeyStatus {
  hasKey: boolean
}

export function useApiKeyStatus() {
  return useQuery({
    queryKey: API_KEY_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient<ApiResponse<ApiKeyStatus>>(
        '/api/settings/api-key'
      )
      return res.data
    },
  })
}

export function useSaveApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (apiKey: string) => {
      const res = await apiClient<ApiResponse<ApiKeyStatus>>(
        '/api/settings/api-key',
        {
          method: 'PUT',
          body: JSON.stringify({ apiKey }),
        }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEY_QUERY_KEY })
    },
  })
}

export function useRemoveApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient<ApiResponse<ApiKeyStatus>>(
        '/api/settings/api-key',
        {
          method: 'DELETE',
        }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEY_QUERY_KEY })
    },
  })
}

// --- Notification Preferences ---

export interface NotificationPreferences {
  dueTasks: boolean
  overdueTasks: boolean
  habitReminders: boolean
  flashcardReminders: boolean
  dailyReviewReminders: boolean
}

const NOTIF_PREFS_KEY = ['settings', 'notification-preferences'] as const

export function useNotificationPreferences() {
  return useQuery({
    queryKey: NOTIF_PREFS_KEY,
    queryFn: async () => {
      const res = await apiClient<ApiResponse<NotificationPreferences>>(
        '/api/settings/notification-preferences'
      )
      return res.data
    },
  })
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (prefs: Partial<NotificationPreferences>) => {
      const res = await apiClient<ApiResponse<NotificationPreferences>>(
        '/api/settings/notification-preferences',
        {
          method: 'PUT',
          body: JSON.stringify(prefs),
        }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIF_PREFS_KEY })
    },
  })
}
