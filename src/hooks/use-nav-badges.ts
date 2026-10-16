'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'

export interface NavBadges {
  cardsDue: number
  overdueTasks: number
  unreadNotifications: number
  /** Captures waiting to be processed. */
  inboxCount: number
}

export const NAV_BADGES_KEY = ['nav', 'badges'] as const

/** Small counters for sidebar badges, polled once a minute. */
export function useNavBadges() {
  return useQuery({
    queryKey: NAV_BADGES_KEY,
    queryFn: () => apiClient<ApiResponse<NavBadges>>('/api/nav/badges'),
    select: (res) => res.data,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
