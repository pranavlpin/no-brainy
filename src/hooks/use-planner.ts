import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { dateFromKey } from '@/lib/dates'
import type { ApiResponse } from '@/lib/types/api'
import type {
  DayPlanResponse,
  PlannerGoal,
  TriageRequest,
  UpdateDayPlanRequest,
} from '@/lib/types/planner'
import type { TaskResponse } from '@/lib/types/tasks'

export interface TodayPlanData extends DayPlanResponse {
  focusTasks: TaskResponse[]
  tasksDueToday: TaskResponse[]
  /** Yesterday's open tasks awaiting a keep / move / drop decision. */
  carryForward: TaskResponse[]
  goals: PlannerGoal[]
}

export interface DatePlanData extends DayPlanResponse {
  focusTasks: TaskResponse[]
  tasksDueOnDate: TaskResponse[]
}

export interface CarryForwardData {
  suggestions: TaskResponse[]
  yesterdayDate: string
}

export const TODAY_PLAN_KEY = ['planner', 'today'] as const

type TodayCache = ApiResponse<TodayPlanData> | undefined

export function useTodayPlan() {
  return useQuery({
    queryKey: TODAY_PLAN_KEY,
    queryFn: () => apiClient<ApiResponse<TodayPlanData>>('/api/planner/today'),
    select: (res) => res.data,
  })
}

/** Collect every task object visible in task-bearing caches, by id. */
function knownTasks(queryClient: ReturnType<typeof useQueryClient>): Map<string, TaskResponse> {
  const map = new Map<string, TaskResponse>()
  const visit = (value: unknown, depth = 0) => {
    if (depth > 5 || value == null) return
    if (Array.isArray(value)) {
      value.forEach((v) => visit(v, depth + 1))
      return
    }
    if (typeof value === 'object') {
      const rec = value as Record<string, unknown>
      if (typeof rec.id === 'string' && typeof rec.title === 'string' && 'priority' in rec) {
        map.set(rec.id, rec as unknown as TaskResponse)
        return
      }
      Object.values(rec).forEach((v) => visit(v, depth + 1))
    }
  }
  for (const [, data] of queryClient.getQueriesData({ queryKey: ['tasks'] })) visit(data)
  for (const [, data] of queryClient.getQueriesData({ queryKey: ['planner'] })) visit(data)
  for (const [, data] of queryClient.getQueriesData({ queryKey: ['home'] })) visit(data)
  return map
}

function invalidatePlanner(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['planner'] })
  queryClient.invalidateQueries({ queryKey: ['tasks'] })
  queryClient.invalidateQueries({ queryKey: ['home'] })
}

export function useUpdatePlan() {
  const queryClient = useQueryClient()
  return useMutation<
    ApiResponse<TodayPlanData>,
    unknown,
    UpdateDayPlanRequest,
    { previous: TodayCache }
  >({
    mutationFn: (data) =>
      apiClient<ApiResponse<TodayPlanData>>('/api/planner/today', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: TODAY_PLAN_KEY })
      const previous = queryClient.getQueryData<ApiResponse<TodayPlanData>>(TODAY_PLAN_KEY)
      if (previous?.data) {
        const known = knownTasks(queryClient)
        const focusTaskIds = data.focusTaskIds ?? previous.data.focusTaskIds
        const focusTasks = focusTaskIds
          .map((id) => known.get(id) ?? previous.data.focusTasks.find((t) => t.id === id))
          .filter((t): t is TaskResponse => !!t)
        queryClient.setQueryData<ApiResponse<TodayPlanData>>(TODAY_PLAN_KEY, {
          ...previous,
          data: {
            ...previous.data,
            ...(data.timeBlocks !== undefined && { timeBlocks: data.timeBlocks }),
            ...(data.aiBriefMd !== undefined && { aiBriefMd: data.aiBriefMd }),
            ...(data.intentMd !== undefined && { intentMd: data.intentMd }),
            focusTaskIds,
            focusTasks,
            carryForward: previous.data.carryForward.filter((t) => !focusTaskIds.includes(t.id)),
          },
        })
      }
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(TODAY_PLAN_KEY, context.previous)
    },
    onSettled: () => invalidatePlanner(queryClient),
  })
}

/** Keep / move / drop a leftover task, optimistically removing it from triage. */
export function useTriageTask() {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<TaskResponse>, unknown, TriageRequest, { previous: TodayCache }>({
    mutationFn: (body) =>
      apiClient<ApiResponse<TaskResponse>>('/api/planner/triage', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: TODAY_PLAN_KEY })
      const previous = queryClient.getQueryData<ApiResponse<TodayPlanData>>(TODAY_PLAN_KEY)
      if (previous?.data) {
        const moving = previous.data.carryForward.find((t) => t.id === body.taskId)
        const carryForward = previous.data.carryForward.filter((t) => t.id !== body.taskId)
        let tasksDueToday = previous.data.tasksDueToday
        if (body.action === 'keep' && moving) {
          const todayIso = dateFromKey(previous.data.planDate.slice(0, 10)).toISOString()
          tasksDueToday = [...tasksDueToday, { ...moving, dueDate: todayIso }]
        }
        queryClient.setQueryData<ApiResponse<TodayPlanData>>(TODAY_PLAN_KEY, {
          ...previous,
          data: { ...previous.data, carryForward, tasksDueToday },
        })
      }
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(TODAY_PLAN_KEY, context.previous)
    },
    onSettled: () => invalidatePlanner(queryClient),
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
