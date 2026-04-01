import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { ApiResponse } from "@/lib/types/api"
import type { DayPlanResponse, UpdateDayPlanRequest } from "@/lib/types/planner"
import type { TaskResponse } from "@/lib/types/tasks"

export interface TodayPlanData extends DayPlanResponse {
  focusTasks: TaskResponse[]
  tasksDueToday: TaskResponse[]
}

export interface DatePlanData extends DayPlanResponse {
  focusTasks: TaskResponse[]
  tasksDueOnDate: TaskResponse[]
}

export interface CarryForwardData {
  suggestions: TaskResponse[]
  yesterdayDate: string
}

export function useTodayPlan() {
  return useQuery({
    queryKey: ["planner", "today"],
    queryFn: () =>
      apiClient<ApiResponse<TodayPlanData>>("/api/planner/today"),
    select: (res) => res.data,
  })
}

export function useUpdatePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateDayPlanRequest) =>
      apiClient<ApiResponse<TodayPlanData>>("/api/planner/today", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner"] })
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useDatePlan(date: string | undefined) {
  return useQuery({
    queryKey: ["planner", date],
    queryFn: () =>
      apiClient<ApiResponse<DatePlanData>>(`/api/planner/${date}`),
    select: (res) => res.data,
    enabled: !!date,
  })
}

export function useCarryForward() {
  return useMutation({
    mutationFn: () =>
      apiClient<ApiResponse<CarryForwardData>>("/api/planner/carry-forward", {
        method: "POST",
      }),
  })
}
