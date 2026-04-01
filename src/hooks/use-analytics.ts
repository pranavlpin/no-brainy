import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'

export interface AnalyticsData {
  taskCompletionRate: { date: string; completed: number; total: number }[]
  tasksByPriority: { priority: string; count: number; completed: number }[]
  tasksByDay: { day: string; count: number }[]
  notesCreatedPerWeek: { week: string; count: number }[]
  totalNotes: number
  flashcardStats: {
    total: number
    new: number
    learning: number
    review: number
    mastered: number
  }
  reviewStreak: number
  habitCompletionRate: number
  mostActiveHours: { hour: number; count: number }[]
  totalTasksCompleted: number
  totalBooksRead: number
  totalCardsReviewed: number
}

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: () =>
      apiClient<ApiResponse<AnalyticsData>>('/api/analytics'),
    select: (res) => res.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
