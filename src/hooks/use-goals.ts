'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type {
  GoalResponse,
  CreateGoalRequest,
  UpdateGoalRequest,
  GoalStatus,
} from '@/lib/types/goals'
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'

const GOALS_KEY = ['goals']

export interface GoalFilters {
  status?: GoalStatus
  category?: string
}

function buildGoalQueryString(filters?: GoalFilters): string {
  if (!filters) return ''
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.category) params.set('category', filters.category)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

/** Load the full owned goal collection for relationship selectors and legacy consumers. */
export function useGoals(filters?: GoalFilters) {
  return useQuery({
    queryKey: [...GOALS_KEY, filters],
    queryFn: async () => {
      const items: GoalResponse[] = []
      let page = 1
      while (true) {
        const params = new URLSearchParams(buildGoalQueryString(filters).replace(/^\?/, ''))
        params.set('page', String(page))
        params.set('pageSize', '100')
        const response = await apiClient<ApiResponse<PaginatedResponse<GoalResponse>>>(
          `/api/goals?${params}`
        )
        items.push(...response.data.items)
        if (!response.data.hasMore) return items
        if (!response.data.items.length) throw new Error('Goal collection could not finish loading')
        page++
      }
    },
  })
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: [...GOALS_KEY, id],
    queryFn: () => apiClient<ApiResponse<GoalResponse>>(`/api/goals/${id}`).then((res) => res.data),
    enabled: !!id,
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateGoalRequest) =>
      apiClient<ApiResponse<GoalResponse>>('/api/goals', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_KEY })
      queryClient.invalidateQueries({ queryKey: ['growth'] })
    },
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGoalRequest }) =>
      apiClient<ApiResponse<GoalResponse>>(`/api/goals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then((res) => res.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: GOALS_KEY })
      queryClient.invalidateQueries({ queryKey: ['growth'] })
      queryClient.invalidateQueries({ queryKey: [...GOALS_KEY, variables.id] })
    },
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<ApiResponse<null>>(`/api/goals/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_KEY })
      queryClient.invalidateQueries({ queryKey: ['growth'] })
    },
  })
}
