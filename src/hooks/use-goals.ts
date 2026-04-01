'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type {
  GoalResponse,
  CreateGoalRequest,
  UpdateGoalRequest,
  GoalStatus,
  HabitResponse,
  CreateHabitRequest,
  UpdateHabitRequest,
  HabitLogResponse,
  CreateHabitLogRequest,
} from '@/lib/types/goals'
import type { ApiResponse } from '@/lib/types/api'

const GOALS_KEY = ['goals']
const HABITS_KEY = ['habits']

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

// ── Goals ──

export function useGoals(filters?: GoalFilters) {
  return useQuery({
    queryKey: [...GOALS_KEY, filters],
    queryFn: () =>
      apiClient<ApiResponse<GoalResponse[]>>(
        `/api/goals${buildGoalQueryString(filters)}`
      ).then((res) => res.data),
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

// ── Habits ──

export function useHabits() {
  return useQuery({
    queryKey: HABITS_KEY,
    queryFn: () =>
      apiClient<ApiResponse<HabitResponse[]>>('/api/habits').then(
        (res) => res.data
      ),
  })
}

export function useHabit(id: string) {
  return useQuery({
    queryKey: [...HABITS_KEY, id],
    queryFn: () =>
      apiClient<ApiResponse<HabitResponse>>(`/api/habits/${id}`).then(
        (res) => res.data
      ),
    enabled: !!id,
  })
}

export function useCreateHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateHabitRequest) =>
      apiClient<ApiResponse<HabitResponse>>('/api/habits', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY })
    },
  })
}

export function useUpdateHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHabitRequest }) =>
      apiClient<ApiResponse<HabitResponse>>(`/api/habits/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then((res) => res.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY })
      queryClient.invalidateQueries({ queryKey: [...HABITS_KEY, variables.id] })
    },
  })
}

export function useDeleteHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<ApiResponse<null>>(`/api/habits/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY })
    },
  })
}

// ── Habit Logs ──

export function useLogHabit(habitId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateHabitLogRequest) =>
      apiClient<ApiResponse<HabitLogResponse>>(`/api/habits/${habitId}/log`, {
        method: 'POST',
        body: JSON.stringify(data),
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY })
      queryClient.invalidateQueries({ queryKey: [...HABITS_KEY, habitId, 'logs'] })
      queryClient.invalidateQueries({ queryKey: [...HABITS_KEY, habitId, 'streak'] })
    },
  })
}

export function useHabitLogs(habitId: string, from?: string, to?: string) {
  return useQuery({
    queryKey: [...HABITS_KEY, habitId, 'logs', from, to],
    queryFn: () => {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const qs = params.toString()
      return apiClient<ApiResponse<HabitLogResponse[]>>(
        `/api/habits/${habitId}/log${qs ? `?${qs}` : ''}`
      ).then((res) => res.data)
    },
    enabled: !!habitId,
  })
}

export function useHabitStreak(habitId: string) {
  return useQuery({
    queryKey: [...HABITS_KEY, habitId, 'streak'],
    queryFn: () =>
      apiClient<ApiResponse<{ currentStreak: number; longestStreak: number }>>(
        `/api/habits/${habitId}/streak`
      ).then((res) => res.data),
    enabled: !!habitId,
  })
}
