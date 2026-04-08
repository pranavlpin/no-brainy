import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'
import type {
  ExpenseCategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/lib/types/expenses'

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: () =>
      apiClient<ApiResponse<ExpenseCategoryResponse[]>>(
        '/api/expenses/categories'
      ),
    select: (res) => res.data,
  })
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) =>
      apiClient<ApiResponse<ExpenseCategoryResponse>>(
        '/api/expenses/categories',
        { method: 'POST', body: JSON.stringify(data) }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
    },
  })
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      apiClient<ApiResponse<ExpenseCategoryResponse>>(
        `/api/expenses/categories/${id}`,
        { method: 'PATCH', body: JSON.stringify(data) }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
    },
  })
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<ApiResponse<{ id: string }>>(
        `/api/expenses/categories/${id}`,
        { method: 'DELETE' }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
    },
  })
}
