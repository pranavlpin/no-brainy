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
