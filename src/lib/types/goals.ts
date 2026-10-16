export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned'

export interface GrowthFields {
  successCriteria?: string
  baseline?: number | null
  target?: number | null
  unit?: string | null
  weeklyPracticeTarget?: number | null
}

export interface GoalResponse extends GrowthFields {
  measurement?: number | null
  measurementDate?: string | null
  taskPercent?: number
  outcomePercent?: number | null
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

export interface CreateGoalRequest extends GrowthFields {
  title: string
  description?: string
  category?: string | null
  targetDate?: string | null
  startDate?: string | null
  expenseCategoryId?: string | null
  expenseTag?: string | null
  targetAmount?: number | null
  status?: GoalStatus
}

export interface UpdateGoalRequest extends GrowthFields {
  expectedUpdatedAt?: string
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
