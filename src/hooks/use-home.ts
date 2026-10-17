'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'
import type { HomeData } from '@/lib/types/home'

export const HOME_KEY = ['home'] as const

/** The Today cockpit payload. Invalidated by task, plan, and review mutations. */
export function useHome() {
  return useQuery({
    queryKey: HOME_KEY,
    queryFn: () => apiClient<ApiResponse<HomeData>>('/api/home'),
    select: (res) => res.data,
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000,
  })
}
