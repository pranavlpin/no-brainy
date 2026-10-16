import { act, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { it, expect, vi } from 'vitest'
import { FocusProvider, useFocus } from '@/hooks/use-focus'
const state = vi.hoisted(() => ({
  resolve: (_value: unknown) => {},
  store: new Map<string, string>(),
}))
vi.mock('@/hooks/use-auth', () => ({ useAuth: () => ({ user: { id: 'new-device-owner' } }) }))
vi.mock('@/lib/api-client', () => ({
  apiClient: async (url: string) =>
    url === '/api/settings/personal'
      ? new Promise((resolve) => {
          state.resolve = resolve
        })
      : { data: { active: null, recent: [], serverNow: new Date().toISOString() } },
}))
function Sound() {
  const focus = useFocus()
  return <p>{focus.loading ? 'Loading' : `Sound: ${focus.setup.sound}`}</p>
}
it('applies the saved sound default on a new device even if Focus loads before settings', async () => {
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => state.store.get(key) ?? null,
    setItem: (key: string, value: string) => state.store.set(key, value),
    removeItem: (key: string) => state.store.delete(key),
  })
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={cache}>
      <FocusProvider>
        <Sound />
      </FocusProvider>
    </QueryClientProvider>
  )
  await screen.findByText('Sound: false')
  await waitFor(() => expect(state.store.size).toBe(1))
  await act(async () =>
    state.resolve({
      data: { timezone: 'UTC', sound: true, reduceMotion: false, setupComplete: true },
    })
  )
  await screen.findByText('Sound: true')
})
