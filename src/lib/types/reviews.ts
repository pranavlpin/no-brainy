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
  /** The one thing for tomorrow, handed into the next day's plan. */
  tomorrowIntent: string | null
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
  tomorrowIntent?: string
}

export interface UpdateReviewRequest {
  tasksCompleted?: number
  tasksMissed?: number
  notesCreated?: number
  cardsReviewed?: number
  reflectionMd?: string
  aiSummaryMd?: string | null
  mood?: string | null
  tomorrowIntent?: string | null
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

export interface WeeklyOutcome {
  id: string
  text: string
}

export interface WeeklyReviewResponse {
  id: string
  userId: string
  /** Monday key. */
  weekStart: string
  /** Sunday key. */
  weekEnd: string
  stopDoing: string
  keepDoing: string
  startTrying: string
  reflectionMd: string
  outcomes: WeeklyOutcome[]
  nextTaskId: string | null
  nextTask: { id: string; title: string; plannedDate: string | null; status: string } | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface WeeklyReviewUpdate {
  stopDoing?: string
  keepDoing?: string
  startTrying?: string
  reflectionMd?: string
  outcomes?: WeeklyOutcome[]
  nextTaskId?: string | null
  closeReview?: boolean
  expectedUpdatedAt?: string
}
