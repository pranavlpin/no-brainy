export type InsightType =
  | 'task_overdue'
  | 'habit_streak'
  | 'habit_broken'
  | 'goal_progress'
  | 'review_reminder'
  | 'productivity_tip'
  | 'weekly_summary'
  | 'learning_suggestion'

export type InsightSeverity = 'info' | 'warning' | 'success'

export interface InsightResponse {
  id: string
  userId: string
  insightType: InsightType
  contentMd: string
  severity: InsightSeverity | null
  relatedEntity: string | null
  relatedIds: string[]
  isDismissed: boolean
  generatedAt: string
  validUntil: string | null
}

export interface DismissInsightRequest {
  insightId: string
}

export interface InsightFilters {
  insightType?: InsightType | InsightType[]
  isDismissed?: boolean
  relatedEntity?: string
  sortBy?: 'generatedAt' | 'insightType'
  sortOrder?: 'asc' | 'desc'
}
