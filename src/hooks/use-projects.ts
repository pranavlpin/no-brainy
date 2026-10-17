'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'
import type {
  ProjectFilters,
  ProjectInput,
  ProjectResponse,
  ProjectUpdate,
} from '@/lib/types/projects'

export const PROJECTS_KEY = ['projects'] as const

function invalidateProjectBearing(client: ReturnType<typeof useQueryClient>) {
  client.invalidateQueries({ queryKey: [...PROJECTS_KEY] })
  client.invalidateQueries({ queryKey: ['tasks'] })
  client.invalidateQueries({ queryKey: ['planner'] })
  client.invalidateQueries({ queryKey: ['home'] })
}

/** Owned projects; archived ones only when asked for. */
export function useProjects(filters: ProjectFilters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.context && filters.context !== 'all') params.set('context', filters.context)
  if (filters.search) params.set('search', filters.search)
  const qs = params.toString()
  return useQuery({
    queryKey: [...PROJECTS_KEY, 'list', filters],
    queryFn: () =>
      apiClient<ApiResponse<ProjectResponse[]>>(`/api/projects${qs ? `?${qs}` : ''}`).then(
        (res) => res.data
      ),
    placeholderData: (previous) => previous,
  })
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, 'detail', id],
    queryFn: () =>
      apiClient<ApiResponse<ProjectResponse>>(`/api/projects/${id}`).then((res) => res.data),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (data: ProjectInput) =>
      apiClient<ApiResponse<ProjectResponse>>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then((res) => res.data),
    onSuccess: () => client.invalidateQueries({ queryKey: [...PROJECTS_KEY] }),
  })
}

export function useUpdateProject() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectUpdate }) =>
      apiClient<ApiResponse<ProjectResponse>>(`/api/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then((res) => res.data),
    onSuccess: (data) => {
      client.setQueryData([...PROJECTS_KEY, 'detail', data.id], data)
      invalidateProjectBearing(client)
    },
  })
}

/** Create and select a next action in one transaction; reuse the submission id on retry. */
export function useAddProjectAction() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      title,
      submissionId,
    }: {
      id: string
      title: string
      submissionId: string
    }) =>
      apiClient<ApiResponse<ProjectResponse>>(`/api/projects/${id}/actions`, {
        method: 'POST',
        body: JSON.stringify({ title, submissionId }),
      }).then((res) => res.data),
    onSuccess: (data) => {
      client.setQueryData([...PROJECTS_KEY, 'detail', data.id], data)
      invalidateProjectBearing(client)
    },
  })
}
