'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'
import type { TaskResponse } from '@/lib/types/tasks'
import type {
  EvidenceResponse,
  EvidenceInput,
  EvidenceEdit,
  GrowthActionInput,
  GrowthOverview,
  GrowthSourceType,
} from '@/lib/types/growth'
/** Read account-local weekly practice and lifetime outcome evidence. */
export function useGrowth(goalId?: string, week?: string) {
  return useQuery({
    queryKey: ['growth', 'overview', goalId, week],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (goalId) params.set('goalId', goalId)
      if (week) params.set('week', week)
      return (await apiClient<ApiResponse<GrowthOverview>>(`/api/growth?${params}`)).data
    },
  })
}
/** Read one explicit page of dated observations for a goal. */
export function useGrowthEvidence(goalId: string, page = 1) {
  return useQuery({
    queryKey: ['growth', 'evidence', goalId, page],
    enabled: !!goalId,
    queryFn: async () =>
      (
        await apiClient<ApiResponse<PaginatedResponse<EvidenceResponse>>>(
          `/api/growth/evidence?goalId=${encodeURIComponent(goalId)}&page=${page}`
        )
      ).data,
  })
}
/** Search paginated owned sources only after a source type is selected. */
export function useGrowthSources(type: GrowthSourceType | null, search: string, page: number) {
  return useQuery({
    queryKey: ['growth', 'sources', type, search, page],
    enabled: !!type,
    queryFn: async () =>
      (
        await apiClient<
          ApiResponse<{
            items: { id: string; title: string; observedAt?: string }[]
            hasMore: boolean
            page: number
          }>
        >(`/api/growth/sources?${new URLSearchParams({ type: type!, search, page: String(page) })}`)
      ).data,
  })
}
function useInvalidateGrowth() {
  const cache = useQueryClient()
  return () => {
    for (const key of ['growth', 'goals', 'tasks', 'planner', 'projects'])
      void cache.invalidateQueries({ queryKey: [key] })
  }
}
/** Create an action with a stable caller request ID and refresh related views. */
export function useCreateGrowthAction() {
  const invalidate = useInvalidateGrowth()
  return useMutation({
    mutationFn: async (input: GrowthActionInput) =>
      (
        await apiClient<ApiResponse<TaskResponse>>('/api/growth/actions', {
          method: 'POST',
          body: JSON.stringify(input),
        })
      ).data,
    onSuccess: invalidate,
  })
}
/** Create or version-correct an observation, preserving the original source. */
export function useSaveEvidence() {
  const invalidate = useInvalidateGrowth()
  return useMutation({
    mutationFn: async (input: EvidenceInput | { id: string; data: EvidenceEdit }) =>
      (
        await apiClient<ApiResponse<EvidenceResponse>>(
          'id' in input ? `/api/growth/evidence/${input.id}` : '/api/growth/evidence',
          {
            method: 'id' in input ? 'PATCH' : 'POST',
            body: JSON.stringify('id' in input ? input.data : input),
          }
        )
      ).data,
    onSuccess: invalidate,
  })
}
/** Remove only the selected owned observation after the UI confirmation. */
export function useDeleteEvidence() {
  const invalidate = useInvalidateGrowth()
  return useMutation({
    mutationFn: (id: string) => apiClient(`/api/growth/evidence/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}
