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
  successCriteria: string
  baseline: number | null
  target: number | null
  unit: string | null
  weeklyPracticeTarget: number | null
  createdAt: string
  updatedAt: string
  taskCount?: number
  completedTaskCount?: number
  /** Latest recorded measurement and its day; null until evidence carries one. */
  measurement?: number | null
  measurementDate?: string | null
  /** Distance from baseline to target, 0..100; null when not measurable. */
  outcomePercent?: number | null
  taskPercent?: number
  /** Distinct practice days in the current local week. */
  practiceCount?: number
  evidenceCount?: number
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
  successCriteria?: string
  baseline?: number | null
  target?: number | null
  unit?: string | null
  weeklyPracticeTarget?: number | null
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
  successCriteria?: string
  baseline?: number | null
  target?: number | null
  unit?: string | null
  weeklyPracticeTarget?: number | null
}
