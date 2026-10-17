import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

const apiClient = vi.fn()
vi.mock('@/lib/api-client', () => ({ apiClient: (...args: unknown[]) => apiClient(...args) }))

import { useCreateCard } from '@/hooks/use-flashcards'

describe('useCreateCard', () => {
  it('posts to the deck cards route the server actually serves', async () => {
    apiClient.mockResolvedValue({ success: true, data: { id: 'c1', deckId: 'd1' } })
    const qc = new QueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useCreateCard(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({
        deckId: 'd1',
        cardType: 'basic',
        frontMd: 'Hola',
        backMd: 'Hello',
        tags: [],
      })
    })
    const [url, init] = apiClient.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/decks/d1/cards')
    expect(init.method).toBe('POST')
    const body = JSON.parse(String(init.body))
    expect(body).not.toHaveProperty('deckId')
    expect(body).toMatchObject({ cardType: 'basic', frontMd: 'Hola', backMd: 'Hello' })
  })
})
