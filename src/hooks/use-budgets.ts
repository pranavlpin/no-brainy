'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'
import type {
  BudgetResponse,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from '@/lib/types/budgets'

const BUDGETS_KEY = ['budgets']

export function useBudgets() {
  return useQuery({
    queryKey: BUDGETS_KEY,
    queryFn: () =>
      apiClient<ApiResponse<BudgetResponse[]>>('/api/budgets').then(
        (res) => res.data
      ),
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateBudgetRequest) =>
      apiClient<ApiResponse<BudgetResponse>>('/api/budgets', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_KEY })
    },
  })
}

export function useUpdateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBudgetRequest }) =>
      apiClient<ApiResponse<BudgetResponse>>(`/api/budgets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_KEY })
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<ApiResponse<{ id: string }>>(`/api/budgets/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_KEY })
    },
  })
}
