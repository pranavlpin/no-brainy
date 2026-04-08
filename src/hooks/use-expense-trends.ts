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

export function useExpenseTrends(months: number = 6) {
  return useQuery({
    queryKey: ['expense-trends', months],
    queryFn: () =>
      apiClient<ApiResponse<TrendsResponse>>(
        `/api/expenses/trends?months=${months}`
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
