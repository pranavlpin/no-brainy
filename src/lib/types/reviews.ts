import type { TaskResponse } from './tasks'
import type { FocusSessionResponse } from './focus'
export interface DailyReviewResponse {
  id: string
  userId: string
  reviewDate: string
  tasksCompleted: number
  tasksMissed: number
  notesCreated: number
  cardsReviewed: number
  reflectionMd: string
  aiSummaryMd: string | null
  mood: string | null
  createdAt: string
  updatedAt: string
  whatMoved: string
  blockers: string
  tomorrowTaskId: string | null
  closedAt: string | null
}

export interface CreateReviewRequest {
  reviewDate: string
  tasksCompleted?: number
  tasksMissed?: number
  notesCreated?: number
  cardsReviewed?: number
  reflectionMd?: string
  mood?: string
}

export interface UpdateReviewRequest {
  tasksCompleted?: number
  tasksMissed?: number
  notesCreated?: number
  cardsReviewed?: number
  reflectionMd?: string
  aiSummaryMd?: string | null
  mood?: string | null
}

export interface WeeklySummaryResponse {
  week: string
  startDate: string
  endDate: string
  totalTasksCompleted: number
  totalTasksMissed: number
  totalNotesCreated: number
  totalCardsReviewed: number
  completionRate: number
  streak: number
  dailyBreakdown: {
    date: string
    tasksCompleted: number
    tasksMissed: number
    notesCreated: number
    cardsReviewed: number
    mood: string | null
    hasReview: boolean
  }[]
}

export interface ReviewActivity {
  tasksCompleted: number
  tasksMissed: number
  notesCreated: number
  cardsReviewed: number
  completedTasks: TaskResponse[]
  unfinishedTasks: TaskResponse[]
  focusSessions: FocusSessionResponse[]
  focusSeconds: number
}
export interface DailyReviewDetail extends DailyReviewResponse {
  activity: ReviewActivity
  today: string
  timezone: string
}
export interface WeeklyReviewResponse {
  id: string
  userId: string
  weekStart: string
  updatedAt: string
  createdAt: string
  stopDoing: string
  keepDoing: string
  startTrying: string
  reflectionMd: string
  outcomes: { id: 'first' | 'second' | 'third'; text: string }[]
  nextTaskId: string | null
  closedAt: string | null
  activity: ReviewActivity
  today: string
  timezone: string
}
