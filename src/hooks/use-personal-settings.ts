'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'
import type { PersonalSettings } from '@/lib/data/settings'
import { useAuth } from '@/hooks/use-auth'
/** Read the authenticated account's public setup choices without exposing credential preferences. */
export function usePersonalSettings() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['personal-settings', user?.id],
    enabled: !!user?.id,
    queryFn: async () =>
      (await apiClient<ApiResponse<PersonalSettings>>('/api/settings/personal')).data,
  })
}
