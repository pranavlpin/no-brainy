import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { ApiResponse, PaginatedResponse } from "@/lib/types/api"
import type {
  TaskResponse,
  TaskFilters,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskPriority,
} from "@/lib/types/tasks"

// Extended type for list items that include subtasksCount
interface TaskListItem extends TaskResponse {
  subtasksCount?: number
}

function buildQueryString(filters: TaskFilters): string {
  const params = new URLSearchParams()
  if (filters.search) params.set("search", filters.search)
  if (filters.status) {
    const val = Array.isArray(filters.status)
      ? filters.status[0]
      : filters.status
    if (val) params.set("status", val)
  }
  if (filters.priority) {
    const val = Array.isArray(filters.priority)
      ? filters.priority[0]
      : filters.priority
    if (val) params.set("priority", val)
  }
  if (filters.quadrant) params.set("quadrant", filters.quadrant)
  if (filters.tags?.length) params.set("tags", filters.tags.join(","))
  if (filters.goalId) params.set("goalId", filters.goalId)
  if (filters.parentTaskId !== undefined) {
    if (filters.parentTaskId === null) {
      params.set("parentTaskId", "null")
    } else {
      params.set("parentTaskId", filters.parentTaskId)
    }
  }
  if (filters.dueDateFrom) params.set("dueDateFrom", filters.dueDateFrom)
  if (filters.dueDateTo) params.set("dueDateTo", filters.dueDateTo)
  if (filters.sortBy) params.set("sortBy", filters.sortBy)
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder)
  const str = params.toString()
  return str ? `?${str}` : ""
}

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: () =>
      apiClient<ApiResponse<PaginatedResponse<TaskListItem>>>(
        `/api/tasks${buildQueryString(filters)}`
      ),
    select: (res) => res.data,
  })
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: () =>
      apiClient<ApiResponse<TaskResponse>>(`/api/tasks/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTaskRequest) =>
      apiClient<ApiResponse<TaskResponse>>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskRequest }) =>
      apiClient<ApiResponse<TaskResponse>>(`/api/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<ApiResponse<{ id: string }>>(`/api/tasks/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useBulkAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      taskIds: string[]
      action: "complete" | "delete" | "setPriority"
      priority?: TaskPriority
    }) =>
      apiClient<ApiResponse<{ affected: number }>>("/api/tasks/bulk", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useReorderTasks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tasks: { id: string; orderIndex: number }[]) =>
      apiClient<ApiResponse<{ updated: number }>>("/api/tasks/reorder", {
        method: "POST",
        body: JSON.stringify({ tasks }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}
