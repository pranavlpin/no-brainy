'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface InsightData {
  id: string
  userId: string
  insightType: string
  contentMd: string
  severity: string | null
  relatedEntity: string | null
  relatedIds: string[]
  isDismissed: boolean
  generatedAt: string
  validUntil: string | null
}

const INSIGHTS_KEY = ['insights']

interface InsightsResponse {
  success: true
  data: {
    insights: InsightData[]
    total: number
  }
}

interface GenerateResponse {
  success: true
  data: {
    insights: InsightData[]
    generatedAt: string
  }
  model: string
  tokensUsed?: number
}

interface DismissResponse {
  success: true
  data: { id: string; isDismissed: true }
}

export function useInsights(filters?: { dismissed?: boolean; type?: string }) {
  return useQuery({
    queryKey: [...INSIGHTS_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.dismissed !== undefined) params.set('dismissed', String(filters.dismissed))
      if (filters?.type) params.set('type', filters.type)
      const qs = params.toString()
      const url = `/api/insights${qs ? `?${qs}` : ''}`
      const res = await apiClient<InsightsResponse>(url)
      return res.data
    },
  })
}

export function useGenerateInsights() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (modules?: string[]) =>
      apiClient<GenerateResponse>('/api/insights/generate', {
        method: 'POST',
        body: modules ? JSON.stringify({ modules }) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSIGHTS_KEY })
    },
  })
}

export function useDismissInsight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<DismissResponse>(`/api/insights/${id}/dismiss`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSIGHTS_KEY })
    },
  })
}
