'use client'

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type {
  StashChannelResponse,
  StashMessageResponse,
  StashSearchResult,
  CreateChannelRequest,
  UpdateChannelRequest,
  CreateMessageRequest,
  UpdateMessageRequest,
  MessagesPage,
} from '@/types/stash'
import type { ApiResponse } from '@/lib/types/api'

const STASH_KEY = ['stash'] as const

export function useChannels() {
  return useQuery({
    queryKey: [...STASH_KEY, 'channels'],
    queryFn: async () => {
      const res = await apiClient<ApiResponse<StashChannelResponse[]>>('/api/stash/channels')
      return res.data
    },
  })
}

export function useCreateChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateChannelRequest) => {
      const res = await apiClient<ApiResponse<StashChannelResponse>>('/api/stash/channels', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...STASH_KEY, 'channels'] })
    },
  })
}

export function useUpdateChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateChannelRequest & { id: string }) => {
      const res = await apiClient<ApiResponse<StashChannelResponse>>(`/api/stash/channels/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...STASH_KEY, 'channels'] })
    },
  })
}

export function useDeleteChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient(`/api/stash/channels/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STASH_KEY })
    },
  })
}

interface ChannelMessagesOptions {
  pageSize?: number
}

export function useChannelMessages(channelId: string | null, options?: ChannelMessagesOptions) {
  const pageSize = options?.pageSize
  return useInfiniteQuery({
    queryKey: [...STASH_KEY, 'messages', channelId, pageSize ?? null],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      if (pageParam) params.set('cursor', pageParam)
      if (pageSize) params.set('limit', String(pageSize))
      const qs = params.toString()
      const url = `/api/stash/channels/${channelId}/messages${qs ? `?${qs}` : ''}`
      const res = await apiClient<ApiResponse<MessagesPage>>(url)
      return res.data
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!channelId,
  })
}

export function useSendMessage(channelId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateMessageRequest) => {
      const res = await apiClient<ApiResponse<StashMessageResponse>>(
        `/api/stash/channels/${channelId}/messages`,
        { method: 'POST', body: JSON.stringify(data) }
      )
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...STASH_KEY, 'messages', channelId] })
      qc.invalidateQueries({ queryKey: [...STASH_KEY, 'channels'] })
    },
  })
}

export function useUpdateMessage(channelId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateMessageRequest & { id: string }) => {
      const res = await apiClient<ApiResponse<StashMessageResponse>>(
        `/api/stash/messages/${id}`,
        { method: 'PATCH', body: JSON.stringify(data) }
      )
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...STASH_KEY, 'messages', channelId] })
    },
  })
}

export function useDeleteMessage(channelId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient(`/api/stash/messages/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...STASH_KEY, 'messages', channelId] })
    },
  })
}

export function useStashSearch(query: string, channelId?: string) {
  return useQuery({
    queryKey: [...STASH_KEY, 'search', query, channelId ?? null],
    queryFn: async () => {
      const params = new URLSearchParams({ q: query })
      if (channelId) params.set('channelId', channelId)
      const res = await apiClient<ApiResponse<StashSearchResult[]>>(
        `/api/stash/search?${params.toString()}`
      )
      return res.data
    },
    enabled: query.trim().length > 0,
  })
}
