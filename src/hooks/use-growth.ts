'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'
import type {
  EvidenceEdit,
  EvidenceInput,
  EvidenceResponse,
  GrowthSourceItem,
  GrowthSourceType,
} from '@/lib/types/growth'

export const GROWTH_KEY = ['growth'] as const

function useInvalidateGrowth() {
  const client = useQueryClient()
  return () => {
    for (const key of ['growth', 'goals', 'home'])
      void client.invalidateQueries({ queryKey: [key] })
  }
}

/** One page of a goal's dated observations, newest first. */
export function useGoalEvidence(goalId: string | undefined, page = 1) {
  return useQuery({
    queryKey: [...GROWTH_KEY, 'evidence', goalId, page],
    enabled: !!goalId,
    queryFn: () =>
      apiClient<ApiResponse<PaginatedResponse<EvidenceResponse>>>(
        `/api/growth/evidence?goalId=${encodeURIComponent(goalId!)}&page=${page}`
      ).then((res) => res.data),
    placeholderData: (previous) => previous,
  })
}

/** Searchable owned sources of a given type; only runs once a type is chosen. */
export function useGrowthSources(type: GrowthSourceType | null, search: string, page: number) {
  return useQuery({
    queryKey: [...GROWTH_KEY, 'sources', type, search, page],
    enabled: !!type,
    queryFn: () =>
      apiClient<ApiResponse<{ items: GrowthSourceItem[]; hasMore: boolean; page: number }>>(
        `/api/growth/sources?${new URLSearchParams({ type: type!, search, page: String(page) })}`
      ).then((res) => res.data),
  })
}

/** Create, or correct with a version check; the original source never changes. */
export function useSaveEvidence() {
  const invalidate = useInvalidateGrowth()
  return useMutation({
    mutationFn: (input: EvidenceInput | { id: string; data: EvidenceEdit }) =>
      apiClient<ApiResponse<EvidenceResponse>>(
        'id' in input ? `/api/growth/evidence/${input.id}` : '/api/growth/evidence',
        {
          method: 'id' in input ? 'PATCH' : 'POST',
          body: JSON.stringify('id' in input ? input.data : input),
        }
      ).then((res) => res.data),
    onSuccess: invalidate,
  })
}

export function useDeleteEvidence() {
  const invalidate = useInvalidateGrowth()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<ApiResponse<{ id: string }>>(`/api/growth/evidence/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}
