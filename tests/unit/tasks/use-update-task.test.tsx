import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

// A plain function (not vi.fn) so vitest does not attach its own handlers to
// the returned promise, which would surface our intentional rejection as
// an unhandled error.
let impl: (...args: unknown[]) => Promise<unknown> = () => Promise.resolve({})
const calls: unknown[][] = []
vi.mock('@/lib/api-client', () => ({
  apiClient: (...a: unknown[]) => {
    calls.push(a)
    return impl(...a)
  },
}))

import { useUpdateTask } from '@/hooks/use-tasks'

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  // Attach a no-op catch so the bare deferred never counts as unhandled.
  promise.catch(() => {})
  return { promise, resolve, reject }
}

const baseTask = {
  id: 'a',
  userId: 'u1',
  parentTaskId: null,
  goalId: null,
  title: 'Write tests',
  descriptionMd: '',
  priority: 'medium',
  status: 'pending',
  tags: [],
  dueDate: null,
  completedAt: null,
  isRecurring: false,
  rrule: null,
  quadrant: null,
  orderIndex: 0,
  createdAt: '2026-10-16T00:00:00.000Z',
  updatedAt: '2026-10-16T00:00:00.000Z',
}

function setup() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  qc.setQueryData(['tasks', { status: 'pending' }], {
    success: true,
    data: { items: [baseTask], total: 1, page: 1, pageSize: 50, hasMore: false },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

const readStatus = (qc: QueryClient) =>
  qc.getQueryData<{ data: { items: Array<{ status: string }> } }>(['tasks', { status: 'pending' }])
    ?.data.items[0].status

describe('useUpdateTask optimistic behavior', () => {
  beforeEach(() => {
    calls.length = 0
  })

  it('applies the new status to the cache before the request resolves', async () => {
    const d = deferred<unknown>()
    impl = () => d.promise
    const { qc, wrapper } = setup()
    const { result } = renderHook(() => useUpdateTask(), { wrapper })

    act(() => {
      result.current.mutate({ id: 'a', data: { status: 'completed' } })
    })
    await waitFor(() => expect(readStatus(qc)).toBe('completed'))
    expect(calls[0][0]).toBe('/api/tasks/a')

    d.resolve({ success: true, data: { ...baseTask, status: 'completed' } })
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.isSuccess).toBe(true)
  })

  it('rolls back when the request fails', async () => {
    const d = deferred<unknown>()
    impl = () => d.promise
    const { qc, wrapper } = setup()
    const { result } = renderHook(() => useUpdateTask(), { wrapper })

    act(() => {
      result.current.mutate({ id: 'a', data: { status: 'completed' } })
    })
    await waitFor(() => expect(readStatus(qc)).toBe('completed'))

    d.reject({ success: false, error: { code: 'INTERNAL_ERROR' } })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(readStatus(qc)).toBe('pending')
  })
})
