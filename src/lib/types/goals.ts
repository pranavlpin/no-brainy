export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned'

export interface GoalResponse {
  id: string
  userId: string
  title: string
  description: string
  category: string | null
  targetDate: string | null
  startDate?: string | null
  expenseCategoryId?: string | null
  expenseCategoryName?: string | null
  expenseTag?: string | null
  targetAmount?: number | null
  currentAmount?: number | null
  financialProgress?: number | null
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
  startDate?: string
  expenseCategoryId?: string
  expenseTag?: string
  targetAmount?: number
  status?: GoalStatus
}

export interface UpdateGoalRequest {
  title?: string
  description?: string
  category?: string | null
  targetDate?: string | null
  startDate?: string | null
  expenseCategoryId?: string | null
  expenseTag?: string | null
  targetAmount?: number | null
  status?: GoalStatus
}
