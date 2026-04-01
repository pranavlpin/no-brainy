export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned'

export type HabitFrequency = 'daily' | 'weekly' | 'monthly'

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
  habits?: HabitResponse[]
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

export interface HabitResponse {
  id: string
  userId: string
  goalId: string | null
  title: string
  frequency: HabitFrequency
  createdAt: string
  currentStreak?: number
  longestStreak?: number
  completionRate?: number
}

export interface CreateHabitRequest {
  title: string
  frequency: HabitFrequency
  goalId?: string
}

export interface UpdateHabitRequest {
  title?: string
  frequency?: HabitFrequency
  goalId?: string | null
}

export interface HabitLogResponse {
  id: string
  habitId: string
  logDate: string
  completed: boolean
}

export interface CreateHabitLogRequest {
  logDate: string
  completed: boolean
}
