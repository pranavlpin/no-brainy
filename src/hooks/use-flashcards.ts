'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type {
  DeckResponse,
  FlashcardResponse,
  CreateDeckRequest,
  UpdateDeckRequest,
  CreateFlashcardRequest,
  UpdateFlashcardRequest,
  ReviewFlashcardRequest,
  ReviewSessionResponse,
  FlashcardState,
} from '@/lib/types/flashcards'
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'

const DECKS_KEY = ['decks'] as const
const CARDS_KEY = ['flashcards'] as const
const REVIEWS_KEY = ['review-sessions'] as const

// ---- Deck hooks ----

export function useDecks() {
  return useQuery({
    queryKey: [...DECKS_KEY, 'list'],
    queryFn: async () => {
      const res = await apiClient<ApiResponse<PaginatedResponse<DeckResponse>>>('/api/decks')
      return res.data.items
    },
  })
}

export function useDeck(id: string) {
  return useQuery({
    queryKey: [...DECKS_KEY, 'detail', id],
    queryFn: async () => {
      const res = await apiClient<ApiResponse<DeckResponse>>(`/api/decks/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateDeck() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateDeckRequest) => {
      const res = await apiClient<ApiResponse<DeckResponse>>('/api/decks', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DECKS_KEY })
    },
  })
}

export function useUpdateDeck() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateDeckRequest & { id: string }) => {
      const res = await apiClient<ApiResponse<DeckResponse>>(`/api/decks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...DECKS_KEY, 'detail', data.id], data)
      queryClient.invalidateQueries({ queryKey: [...DECKS_KEY, 'list'] })
    },
  })
}

export function useDeleteDeck() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient<ApiResponse<{ message: string }>>(`/api/decks/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DECKS_KEY })
    },
  })
}

// ---- Flashcard hooks ----

export interface CardFilters {
  state?: FlashcardState
  tags?: string[]
}

export function useDeckCards(deckId: string, filters?: CardFilters) {
  return useQuery({
    queryKey: [...CARDS_KEY, 'list', deckId, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.state) params.set('state', filters.state)
      if (filters?.tags?.length) params.set('tags', filters.tags.join(','))
      const qs = params.toString()
      const url = `/api/decks/${deckId}/cards${qs ? `?${qs}` : ''}`
      const res = await apiClient<ApiResponse<PaginatedResponse<FlashcardResponse>>>(url)
      return res.data.items
    },
    enabled: !!deckId,
  })
}

export function useCreateCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateFlashcardRequest) => {
      const res = await apiClient<ApiResponse<FlashcardResponse>>('/api/flashcards', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CARDS_KEY })
      queryClient.invalidateQueries({ queryKey: [...DECKS_KEY, 'detail', data.deckId] })
      queryClient.invalidateQueries({ queryKey: [...DECKS_KEY, 'list'] })
    },
  })
}

export function useUpdateCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateFlashcardRequest & { id: string }) => {
      const res = await apiClient<ApiResponse<FlashcardResponse>>(`/api/flashcards/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CARDS_KEY })
      queryClient.invalidateQueries({ queryKey: [...DECKS_KEY, 'detail', data.deckId] })
    },
  })
}

export function useDeleteCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, deckId }: { id: string; deckId: string }) => {
      await apiClient<ApiResponse<{ message: string }>>(`/api/flashcards/${id}`, {
        method: 'DELETE',
      })
      return { deckId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CARDS_KEY })
      queryClient.invalidateQueries({ queryKey: [...DECKS_KEY, 'detail', data.deckId] })
      queryClient.invalidateQueries({ queryKey: [...DECKS_KEY, 'list'] })
    },
  })
}

// ---- Review hooks ----

export function useStartReview(deckId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient<
        ApiResponse<{ session: ReviewSessionResponse; cards: FlashcardResponse[] }>
      >(`/api/decks/${deckId}/review`, {
        method: 'POST',
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEWS_KEY })
    },
  })
}

export function useRateCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ cardId, ...data }: ReviewFlashcardRequest & { cardId: string }) => {
      const res = await apiClient<ApiResponse<FlashcardResponse>>(
        `/api/flashcards/${cardId}/rate`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CARDS_KEY })
    },
  })
}

export function useCompleteReview(sessionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient<ApiResponse<ReviewSessionResponse>>(
        `/api/review-sessions/${sessionId}/complete`,
        { method: 'POST' }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEWS_KEY })
      queryClient.invalidateQueries({ queryKey: DECKS_KEY })
      queryClient.invalidateQueries({ queryKey: CARDS_KEY })
    },
  })
}
