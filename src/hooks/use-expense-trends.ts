import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'

interface CategoryTrend {
  id: string
  name: string
  color: string
  data: Record<string, number>
  total: number
}

interface MonthlyTotal {
  month: string
  total: number
}

interface TrendsResponse {
  months: string[]
  categories: CategoryTrend[]
  monthlyTotals: MonthlyTotal[]
}

interface StatsResponse {
  month: string
  transactionCount: number
  total: number
  average: number
  highest: number
  previousTotal: number
  changePercent: number
  topCategory: { categoryName: string; color: string; total: number } | null
}

interface TrendsFilters {
  fromMonth?: string
  toMonth?: string
}

export function useExpenseTrends(filters: TrendsFilters = {}) {
  const params = new URLSearchParams()
  if (filters.fromMonth) params.set('fromMonth', filters.fromMonth)
  if (filters.toMonth) params.set('toMonth', filters.toMonth)
  const qs = params.toString()

  return useQuery({
    queryKey: ['expense-trends', filters],
    queryFn: () =>
      apiClient<ApiResponse<TrendsResponse>>(
        `/api/expenses/trends${qs ? `?${qs}` : ''}`
      ),
    select: (res) => res.data,
  })
}

export function useExpenseStats(month?: string) {
  const params = month ? `?month=${month}` : ''
  return useQuery({
    queryKey: ['expense-stats', month],
    queryFn: () =>
      apiClient<ApiResponse<StatsResponse>>(
        `/api/expenses/stats${params}`
      ),
    select: (res) => res.data,
  })
}
