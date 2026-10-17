'use client'

import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { browserTimezone } from '@/lib/dates'
import type { ApiResponse } from '@/lib/types/api'

interface TimezoneData {
  timezone: string
  effective: string
}

export const TIMEZONE_KEY = ['settings', 'timezone'] as const

/** Reads the stored timezone for the settings page. */
export function useTimezoneSetting() {
  return useQuery({
    queryKey: TIMEZONE_KEY,
    queryFn: async () =>
      (await apiClient<ApiResponse<TimezoneData>>('/api/settings/timezone')).data,
    staleTime: Infinity,
  })
}

/**
 * Once per session, stores the browser's timezone on the account when it
 * differs from what is saved, so server-side "today" matches the wall clock.
 */
export function TimezoneSync(): null {
  const { data } = useTimezoneSetting()
  const queryClient = useQueryClient()
  const synced = useRef(false)

  useEffect(() => {
    if (!data || synced.current) return
    const local = browserTimezone()
    if (!local || local === data.timezone) return
    synced.current = true
    apiClient<ApiResponse<TimezoneData>>('/api/settings/timezone', {
      method: 'PATCH',
      body: JSON.stringify({ timezone: local }),
    })
      .then((res) => queryClient.setQueryData(TIMEZONE_KEY, res.data))
      .catch(() => {
        synced.current = false
      })
  }, [data, queryClient])

  return null
}
