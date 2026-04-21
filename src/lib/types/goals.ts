export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned'

export interface GoalResponse {
  id: string
  userId: string
  title: string
  description: string
  category: string | null
  targetDate: string | null
  status: GoalStatus
  createdAt: string
  updatedAt: string
  taskCount?: number
  completedTaskCount?: number
}

export interface CreateGoalRequest {
  title: string
  description?: string
  category?: string
  targetDate?: string
  status?: GoalStatus
}

export interface UpdateGoalRequest {
  title?: string
  description?: string
  category?: string | null
  targetDate?: string | null
  status?: GoalStatus
}
