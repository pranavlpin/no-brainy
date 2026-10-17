import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

const apiClient = vi.fn()
vi.mock('@/lib/api-client', () => ({ apiClient: (...args: unknown[]) => apiClient(...args) }))

import { TODAY_PLAN_KEY, useUpdatePlan } from '@/hooks/use-planner'

describe('useUpdatePlan with overlapping saves', () => {
  it('invalidates the planner only after the last pending update settles', async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    qc.setQueryData(TODAY_PLAN_KEY, {
      success: true,
      data: {
        focusTaskIds: [],
        focusTasks: [],
        carryForward: [],
        timeBlocks: [],
        availableMinutes: 180,
        bufferMinutes: 15,
      },
    })
    const invalidate = vi.spyOn(qc, 'invalidateQueries')
    const resolvers: Array<(value: unknown) => void> = []
    apiClient.mockImplementation(() => new Promise((resolve) => resolvers.push(resolve)))
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useUpdatePlan(), { wrapper })

    act(() => result.current.mutate({ availableMinutes: 30 }))
    act(() => result.current.mutate({ bufferMinutes: 5 }))
    await waitFor(() => expect(resolvers).toHaveLength(2))

    // The first save settles while the second is still in flight: no refetch yet,
    // otherwise the stale server state would wipe the second edit.
    await act(async () => {
      resolvers[0]({ success: true, data: {} })
      await Promise.resolve()
    })
    expect(invalidate).not.toHaveBeenCalled()

    await act(async () => {
      resolvers[1]({ success: true, data: {} })
    })
    await waitFor(() => expect(invalidate).toHaveBeenCalled())
  })
})
