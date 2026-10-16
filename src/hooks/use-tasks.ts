import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'
import type {
  TaskResponse,
  TaskFilters,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskPriority,
} from '@/lib/types/tasks'

interface TaskListItem extends TaskResponse {
  subtasksCount?: number
}
const affected = ['tasks', 'planner', 'goals', 'reviews', 'projects']
const relevant = (key: readonly unknown[]) => affected.includes(String(key[0]))
const refresh = (client: QueryClient) =>
  client.invalidateQueries({ predicate: (query) => relevant(query.queryKey) })

function buildQueryString(filters: TaskFilters): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === '') continue
    params.set(key, Array.isArray(value) ? value.join(',') : String(value))
  }
  return `?${params.toString()}`
}
const fetchPage = async (filters: TaskFilters) =>
  (
    await apiClient<
      ApiResponse<PaginatedResponse<TaskListItem> & { today: string; timezone: string }>
    >(`/api/tasks${buildQueryString(filters)}`)
  ).data

/** Fetch one explicit page with its total and continuation metadata. */
export function useTaskPage(filters: TaskFilters = {}) {
  return useQuery({ queryKey: ['tasks', 'page', filters], queryFn: () => fetchPage(filters) })
}

/** Fetch all matching tasks for selectors and legacy consumers, without a silent 20-item cutoff. */
export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ['tasks', 'all', filters],
    queryFn: async () => {
      let page = await fetchPage({ ...filters, page: 1, pageSize: 100 })
      const items = [...page.items]
      while (page.hasMore) {
        page = await fetchPage({ ...filters, page: page.page + 1, pageSize: 100 })
        items.push(...page.items)
      }
      return items
    },
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

/** Update a task wherever it appears inside a task/planner response. */
function patchTask(value: unknown, id: string, patch: UpdateTaskRequest): unknown {
  if (Array.isArray(value)) return value.map((item) => patchTask(item, id, patch))
  if (!value || typeof value !== 'object') return value
  const record = value as Record<string, unknown>
  if (record.id === id && 'status' in record) return { ...record, ...patch }
  return Object.fromEntries(
    Object.entries(record).map(([key, item]) => [key, patchTask(item, id, patch)])
  )
}

export function useCreateTask() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTaskRequest) =>
      apiClient<ApiResponse<TaskResponse>>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => refresh(client),
  })
}

export function useUpdateTask() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskRequest }) =>
      apiClient<ApiResponse<TaskResponse>>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onMutate: async ({ id, data }) => {
      await client.cancelQueries({ predicate: (query) => relevant(query.queryKey) })
      const previous = client.getQueriesData({ predicate: (query) => relevant(query.queryKey) })
      const changes = previous.map(([key, value]) => {
        const next = patchTask(value, id, data)
        client.setQueryData(key, next)
        return { key, value, next: client.getQueryData(key) }
      })
      return changes
    },
    onError: (_error, _variables, changes) => {
      for (const change of changes ?? []) {
        // Do not erase a later optimistic operation on the same query.
        if (client.getQueryData(change.key) === change.next)
          client.setQueryData(change.key, change.value)
      }
    },
    onSettled: () => refresh(client),
  })
}

export function useDeleteTask() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<ApiResponse<{ id: string }>>(`/api/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => refresh(client),
  })
}

export function useBulkAction() {
  const client = useQueryClient()
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
    onSuccess: () => refresh(client),
  })
}

export function useReorderTasks() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (tasks: { id: string; orderIndex: number }[]) =>
      apiClient<ApiResponse<{ updated: number }>>('/api/tasks/reorder', {
        method: 'POST',
        body: JSON.stringify({ tasks }),
      }),
    onSuccess: () => refresh(client),
  })
}
