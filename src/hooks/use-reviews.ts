'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type {
  DailyReviewResponse,
  CreateReviewRequest,
  UpdateReviewRequest,
  WeeklySummaryResponse,
} from '@/lib/types/reviews'
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'

const REVIEWS_KEY = ['reviews'] as const

export function useDailyReviews(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...REVIEWS_KEY, 'daily', 'list', page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      const res = await apiClient<
        ApiResponse<PaginatedResponse<DailyReviewResponse>>
      >(`/api/reviews/daily?${params.toString()}`)
      return res.data
    },
  })
}

export function useDailyReview(date: string) {
  return useQuery({
    queryKey: [...REVIEWS_KEY, 'daily', 'detail', date],
    queryFn: async () => {
      const res = await apiClient<ApiResponse<DailyReviewResponse>>(
        `/api/reviews/daily/${date}`
      )
      return res.data
    },
    enabled: !!date,
    retry: false,
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateReviewRequest) => {
      const res = await apiClient<ApiResponse<DailyReviewResponse>>(
        '/api/reviews/daily',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      )
      return res.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        [...REVIEWS_KEY, 'daily', 'detail', data.reviewDate],
        data
      )
      queryClient.invalidateQueries({ queryKey: [...REVIEWS_KEY, 'daily', 'list'] })
      queryClient.invalidateQueries({ queryKey: [...REVIEWS_KEY, 'weekly'] })
    },
  })
}

export function useUpdateReview(date: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: UpdateReviewRequest) => {
      const res = await apiClient<ApiResponse<DailyReviewResponse>>(
        `/api/reviews/daily/${date}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      )
      return res.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        [...REVIEWS_KEY, 'daily', 'detail', data.reviewDate],
        data
      )
      queryClient.invalidateQueries({ queryKey: [...REVIEWS_KEY, 'daily', 'list'] })
      queryClient.invalidateQueries({ queryKey: [...REVIEWS_KEY, 'weekly'] })
    },
  })
}

export function useWeeklySummary(week?: string) {
  return useQuery({
    queryKey: [...REVIEWS_KEY, 'weekly', week ?? 'current'],
    queryFn: async () => {
      const params = week ? `?week=${week}` : ''
      const res = await apiClient<ApiResponse<WeeklySummaryResponse>>(
        `/api/reviews/weekly${params}`
      )
      return res.data
    },
  })
}
