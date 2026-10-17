'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'
import type { PersonalSettings, PersonalSettingsInput } from '@/lib/settings/personal'

export const PERSONAL_SETTINGS_KEY = ['settings', 'personal'] as const

/** The account's personal defaults: capacity, working window, context, sound. */
export function usePersonalSettings() {
  return useQuery({
    queryKey: PERSONAL_SETTINGS_KEY,
    queryFn: () =>
      apiClient<ApiResponse<PersonalSettings>>('/api/settings/personal').then((res) => res.data),
    staleTime: 60_000,
  })
}

export function useSavePersonalSettings() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: PersonalSettingsInput) =>
      apiClient<ApiResponse<PersonalSettings>>('/api/settings/personal', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }).then((res) => res.data),
    onSuccess: (data) => {
      client.setQueryData(PERSONAL_SETTINGS_KEY, data)
      client.invalidateQueries({ queryKey: ['planner'] })
      client.invalidateQueries({ queryKey: ['home'] })
    },
  })
}
