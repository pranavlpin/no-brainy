export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export type TaskQuadrant =
  'urgent_important' | 'not_urgent_important' | 'urgent_not_important' | 'not_urgent_not_important'

export type TaskEffort = 'light' | 'steady' | 'deep'

export type TaskContext = 'work' | 'personal'

export interface TaskResponse {
  id: string
  userId: string
  parentTaskId: string | null
  goalId: string | null
  projectId: string | null
  title: string
  descriptionMd: string
  priority: TaskPriority
  status: TaskStatus
  tags: string[]
  dueDate: string | null
  completedAt: string | null
  isRecurring: boolean
  rrule: string | null
  quadrant: TaskQuadrant | null
  orderIndex: number
  /** The day you intend to work on it (YYYY-MM-DD); independent of the deadline. */
  plannedDate: string | null
  estimatedMinutes: number | null
  effort: TaskEffort | null
  context: TaskContext | null
  createdAt: string
  updatedAt: string
  subtasks?: TaskResponse[]
  taskLinks?: TaskLinkResponse[]
}

export interface TaskLinkResponse {
  taskId: string
  linkedType: string
  linkedId: string
}

export interface CreateTaskRequest {
  title: string
  descriptionMd?: string
  priority?: TaskPriority
  status?: TaskStatus
  tags?: string[]
  dueDate?: string
  plannedDate?: string | null
  estimatedMinutes?: number | null
  effort?: TaskEffort | null
  context?: TaskContext | null
  parentTaskId?: string
  goalId?: string | null
  projectId?: string | null
  isRecurring?: boolean
  rrule?: string
  quadrant?: TaskQuadrant
  orderIndex?: number
}

export interface UpdateTaskRequest {
  title?: string
  descriptionMd?: string
  priority?: TaskPriority
  status?: TaskStatus
  tags?: string[]
  dueDate?: string | null
  plannedDate?: string | null
  estimatedMinutes?: number | null
  effort?: TaskEffort | null
  context?: TaskContext | null
  parentTaskId?: string | null
  goalId?: string | null
  projectId?: string | null
  isRecurring?: boolean
  rrule?: string | null
  quadrant?: TaskQuadrant | null
  orderIndex?: number
  /** Optimistic concurrency: reject with 409 if the server row changed since. */
  expectedUpdatedAt?: string
}

export interface TaskFilters {
  search?: string
  /** `active` = pending or in progress. */
  status?: TaskStatus | 'active' | TaskStatus[]
  priority?: TaskPriority | TaskPriority[]
  quadrant?: TaskQuadrant
  tags?: string[]
  goalId?: string
  parentTaskId?: string | null
  dueDateFrom?: string
  dueDateTo?: string
  plannedDate?: string
  plannedDateFrom?: string
  plannedDateTo?: string
  context?: TaskContext
  projectId?: string
  page?: number
  pageSize?: number
  sortBy?:
    'createdAt' | 'updatedAt' | 'dueDate' | 'plannedDate' | 'priority' | 'orderIndex' | 'title'
  sortOrder?: 'asc' | 'desc'
}
