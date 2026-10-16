import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'
import type { DayPlanResponse, UpdateDayPlanRequest } from '@/lib/types/planner'
import type { TaskResponse } from '@/lib/types/tasks'

export interface TodayPlanData extends DayPlanResponse {
  focusTasks: TaskResponse[]
  tasksDueToday: TaskResponse[]
  plannedTasks: TaskResponse[]
  growthTask: TaskResponse | null
}

export interface DatePlanData extends TodayPlanData {
  tasksDueOnDate: TaskResponse[]
}

export interface CarryForwardData {
  suggestions: TaskResponse[]
  yesterdayDate: string
}

export function useTodayPlan(enabled = true) {
  return useQuery({
    queryKey: ['planner', 'today'],
    queryFn: () => apiClient<ApiResponse<TodayPlanData>>('/api/planner/today'),
    select: (res) => res.data,
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useUpdatePlan(date?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateDayPlanRequest) =>
      apiClient<ApiResponse<DatePlanData>>(`/api/planner/${date ?? 'today'}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

/** Earlier unfinished work remains reachable, scoped to the date currently being planned. */
export function useUnfinishedTasks(date: string) {
  return useQuery({
    queryKey: ['planner', 'unfinished', date],
    queryFn: () =>
      apiClient<ApiResponse<CarryForwardData>>(`/api/planner/carry-forward?before=${date}`, {
        method: 'POST',
      }).then((result) => result.data),
  })
}

export function useDatePlan(date: string | undefined) {
  return useQuery({
    queryKey: ['planner', date],
    queryFn: () => apiClient<ApiResponse<DatePlanData>>(`/api/planner/${date}`),
    select: (res) => res.data,
    enabled: !!date,
  })
}

export function useCarryForward() {
  return useMutation({
    mutationFn: () =>
      apiClient<ApiResponse<CarryForwardData>>('/api/planner/carry-forward', {
        method: 'POST',
      }),
  })
}
