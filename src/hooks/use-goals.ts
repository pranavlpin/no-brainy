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

export function useGoals(filters?: GoalFilters) {
  return useQuery({
    queryKey: [...GOALS_KEY, filters],
    queryFn: () =>
      apiClient<ApiResponse<PaginatedResponse<GoalResponse>>>(
        `/api/goals${buildGoalQueryString(filters)}`
      ).then((res) => res.data.items),
  })
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: [...GOALS_KEY, id],
    queryFn: () =>
      apiClient<ApiResponse<GoalResponse>>(`/api/goals/${id}`).then(
        (res) => res.data
      ),
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
    },
  })
}
