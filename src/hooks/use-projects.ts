'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'
import type {
  ProjectResponse,
  ProjectInput,
  ProjectUpdate,
  ProjectStatus,
} from '@/lib/types/projects'

/** Owned project collection, including archived projects only when explicitly requested. */
export function useProjects(
  filters: { context?: string; status?: ProjectStatus | 'all'; search?: string } = {}
) {
  const params = new URLSearchParams(
    Object.entries(filters).filter((entry): entry is [string, string] => !!entry[1])
  )
  return useQuery({
    queryKey: ['projects', 'list', filters],
    queryFn: () =>
      apiClient<ApiResponse<ProjectResponse[]>>(`/api/projects?${params}`).then(
        (result) => result.data
      ),
  })
}
export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', 'detail', id],
    queryFn: () =>
      apiClient<ApiResponse<ProjectResponse>>(`/api/projects/${id}`).then((result) => result.data),
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
      }).then((result) => result.data),
    onSuccess: () => client.invalidateQueries({ queryKey: ['projects'] }),
  })
}
export function useUpdateProject() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectUpdate }) =>
      apiClient<ApiResponse<ProjectResponse>>(`/api/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then((result) => result.data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['projects'] })
      client.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

/** Create and select a next action in one transaction; reuse submissionId when retrying. */
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
      }).then((result) => result.data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['projects'] })
      client.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
