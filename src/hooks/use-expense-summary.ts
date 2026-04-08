import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'
import type { ExpenseSummaryResponse } from '@/lib/types/expenses'

interface SummaryFilters {
  startMonth?: string
  endMonth?: string
}

function buildQueryString(filters: SummaryFilters): string {
  const params = new URLSearchParams()
  if (filters.startMonth) params.set('startMonth', filters.startMonth)
  if (filters.endMonth) params.set('endMonth', filters.endMonth)
  const str = params.toString()
  return str ? `?${str}` : ''
}

export function useExpenseSummary(filters: SummaryFilters = {}) {
  return useQuery({
    queryKey: ['expense-summary', filters],
    queryFn: () =>
      apiClient<ApiResponse<ExpenseSummaryResponse>>(
        `/api/expenses/summary${buildQueryString(filters)}`
      ),
    select: (res) => res.data,
  })
}
