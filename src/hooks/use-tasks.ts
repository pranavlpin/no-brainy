import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import {
  patchCaches,
  removeFromCaches,
  restoreCaches,
  type CacheSnapshot,
} from '@/lib/query/optimistic'
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'
import type {
  CreateTaskRequest,
  TaskFilters,
  TaskPriority,
  TaskResponse,
  UpdateTaskRequest,
} from '@/lib/types/tasks'

// Extended type for list items that include subtasksCount
export interface TaskListItem extends TaskResponse {
  subtasksCount?: number
}

/** Fields the server derives or that must never be sent back from a draft. */
const READ_ONLY_FIELDS = new Set([
  'id',
  'userId',
  'createdAt',
  'updatedAt',
  'completedAt',
  'subtasks',
  'taskLinks',
])

/** Build the PUT body for a draft patch, versioned against the row the draft was taken from. */
export function taskDraftBody(patch: Partial<TaskResponse>, version: string): UpdateTaskRequest {
  const body: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch)) {
    if (!READ_ONLY_FIELDS.has(key)) body[key] = value
  }
  return { ...(body as UpdateTaskRequest), expectedUpdatedAt: version }
}

/** Query-key prefixes whose cached payloads embed task objects. */
const TASK_BEARING_KEYS: readonly (readonly string[])[] = [
  ['tasks'],
  ['planner'],
  ['home'],
  ['goals'],
]

function buildQueryString(filters: TaskFilters): string {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.status) {
    const val = Array.isArray(filters.status) ? filters.status[0] : filters.status
    if (val) params.set('status', val)
  }
  if (filters.priority) {
    const val = Array.isArray(filters.priority) ? filters.priority[0] : filters.priority
    if (val) params.set('priority', val)
  }
  if (filters.quadrant) params.set('quadrant', filters.quadrant)
  if (filters.tags?.length) params.set('tags', filters.tags.join(','))
  if (filters.goalId) params.set('goalId', filters.goalId)
  if (filters.parentTaskId !== undefined) {
    if (filters.parentTaskId === null) {
      params.set('parentTaskId', 'null')
    } else {
      params.set('parentTaskId', filters.parentTaskId)
    }
  }
  if (filters.dueDateFrom) params.set('dueDateFrom', filters.dueDateFrom)
  if (filters.dueDateTo) params.set('dueDateTo', filters.dueDateTo)
  if (filters.plannedDate) params.set('plannedDate', filters.plannedDate)
  if (filters.plannedDateFrom) params.set('plannedDateFrom', filters.plannedDateFrom)
  if (filters.plannedDateTo) params.set('plannedDateTo', filters.plannedDateTo)
  if (filters.context) params.set('context', filters.context)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize))
  if (filters.sortBy) params.set('sortBy', filters.sortBy)
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)
  const str = params.toString()
  return str ? `?${str}` : ''
}

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () =>
      apiClient<ApiResponse<PaginatedResponse<TaskListItem>>>(
        `/api/tasks${buildQueryString(filters)}`
      ),
    select: (res) => res.data.items,
  })
}

/** One page of tasks with its pagination metadata. */
export function useTaskPage(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () =>
      apiClient<ApiResponse<PaginatedResponse<TaskListItem>>>(
        `/api/tasks${buildQueryString(filters)}`
      ),
    select: (res) => res.data,
    placeholderData: (previous) => previous,
  })
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => apiClient<ApiResponse<TaskResponse>>(`/api/tasks/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  })
}

/** Build the optimistic version of a task after an update request. */
export function applyTaskUpdate(task: TaskResponse, data: UpdateTaskRequest): TaskResponse {
  const now = new Date().toISOString()
  const next: TaskResponse = { ...task, updatedAt: now }
  if (data.title !== undefined) next.title = data.title
  if (data.descriptionMd !== undefined) next.descriptionMd = data.descriptionMd
  if (data.priority !== undefined) next.priority = data.priority
  if (data.tags !== undefined) next.tags = data.tags
  if (data.dueDate !== undefined) next.dueDate = data.dueDate
  if (data.plannedDate !== undefined) next.plannedDate = data.plannedDate
  if (data.estimatedMinutes !== undefined) next.estimatedMinutes = data.estimatedMinutes
  if (data.effort !== undefined) next.effort = data.effort
  if (data.context !== undefined) next.context = data.context
  if (data.parentTaskId !== undefined) next.parentTaskId = data.parentTaskId
  if (data.goalId !== undefined) next.goalId = data.goalId
  if (data.projectId !== undefined) next.projectId = data.projectId
  if (data.isRecurring !== undefined) next.isRecurring = data.isRecurring
  if (data.rrule !== undefined) next.rrule = data.rrule
  if (data.quadrant !== undefined) next.quadrant = data.quadrant
  if (data.orderIndex !== undefined) next.orderIndex = data.orderIndex
  if (data.status !== undefined) {
    next.status = data.status
    next.completedAt = data.status === 'completed' ? (task.completedAt ?? now) : null
  }
  return next
}

async function cancelTaskBearingQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all(
    TASK_BEARING_KEYS.map((key) => queryClient.cancelQueries({ queryKey: [...key] }))
  )
}

function invalidateTaskBearingQueries(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of TASK_BEARING_KEYS) {
    queryClient.invalidateQueries({ queryKey: [...key] })
  }
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTaskRequest) =>
      apiClient<ApiResponse<TaskResponse>>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSettled: () => invalidateTaskBearingQueries(queryClient),
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation<
    ApiResponse<TaskResponse>,
    unknown,
    { id: string; data: UpdateTaskRequest },
    { snapshots: CacheSnapshot[] }
  >({
    mutationFn: ({ id, data }) =>
      apiClient<ApiResponse<TaskResponse>>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onMutate: async ({ id, data }) => {
      await cancelTaskBearingQueries(queryClient)
      const snapshots = TASK_BEARING_KEYS.flatMap((key) =>
        patchCaches<TaskResponse>(
          queryClient,
          [...key],
          (t) => t.id === id,
          (t) => applyTaskUpdate(t, data)
        )
      )
      return { snapshots }
    },
    onError: (_error, _vars, context) => restoreCaches(queryClient, context?.snapshots),
    onSettled: () => invalidateTaskBearingQueries(queryClient),
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<{ id: string }>, unknown, string, { snapshots: CacheSnapshot[] }>({
    mutationFn: (id) =>
      apiClient<ApiResponse<{ id: string }>>(`/api/tasks/${id}`, {
        method: 'DELETE',
      }),
    onMutate: async (id) => {
      await cancelTaskBearingQueries(queryClient)
      const ids = new Set([id])
      const snapshots = TASK_BEARING_KEYS.flatMap((key) =>
        removeFromCaches(queryClient, [...key], ids)
      )
      return { snapshots }
    },
    onError: (_error, _vars, context) => restoreCaches(queryClient, context?.snapshots),
    onSettled: () => invalidateTaskBearingQueries(queryClient),
  })
}

export function useBulkAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      taskIds: string[]
      action: 'complete' | 'delete' | 'setPriority'
      priority?: TaskPriority
    }) =>
      apiClient<ApiResponse<{ affected: number }>>('/api/tasks/bulk', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSettled: () => invalidateTaskBearingQueries(queryClient),
  })
}

export function useReorderTasks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tasks: { id: string; orderIndex: number }[]) =>
      apiClient<ApiResponse<{ updated: number }>>('/api/tasks/reorder', {
        method: 'POST',
        body: JSON.stringify({ tasks }),
      }),
    onSettled: () => invalidateTaskBearingQueries(queryClient),
  })
}
