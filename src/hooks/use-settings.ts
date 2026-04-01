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
