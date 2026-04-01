export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export type TaskQuadrant = 'urgent_important' | 'not_urgent_important' | 'urgent_not_important' | 'not_urgent_not_important'

export interface TaskResponse {
  id: string
  userId: string
  parentTaskId: string | null
  goalId: string | null
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
  parentTaskId?: string
  goalId?: string
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
  parentTaskId?: string | null
  goalId?: string | null
  isRecurring?: boolean
  rrule?: string | null
  quadrant?: TaskQuadrant | null
  orderIndex?: number
}

export interface TaskFilters {
  search?: string
  status?: TaskStatus | TaskStatus[]
  priority?: TaskPriority | TaskPriority[]
  quadrant?: TaskQuadrant
  tags?: string[]
  goalId?: string
  parentTaskId?: string | null
  dueDateFrom?: string
  dueDateTo?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'orderIndex' | 'title'
  sortOrder?: 'asc' | 'desc'
}
