import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { useUpdateTask } from '@/hooks/use-tasks'
import { apiClient } from '@/lib/api-client'

vi.mock('@/lib/api-client', () => ({ apiClient: vi.fn() }))

it('optimistically updates planner tasks and rolls them back when saving fails', async () => {
  let rejectSave!: (reason: Error) => void
  vi.mocked(apiClient).mockImplementation(
    () =>
      new Promise((_, reject) => {
        rejectSave = reject
      })
  )
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const original = { data: { focusTasks: [{ id: 't1', title: 'Focus', status: 'pending' }] } }
  client.setQueryData(['planner', 'today'], original)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useUpdateTask(), { wrapper })
  act(() => result.current.mutate({ id: 't1', data: { status: 'completed' } }))
  await waitFor(() => expect(rejectSave).toBeTypeOf('function'))
  expect(client.getQueryData(['planner', 'today'])).toMatchObject({
    data: { focusTasks: [{ id: 't1', status: 'completed' }] },
  })
  await act(async () => {
    rejectSave(new Error('Offline'))
  })
  await waitFor(() => expect(result.current.isError).toBe(true))
  expect(client.getQueryData(['planner', 'today'])).toEqual(original)
  client.clear()
})
