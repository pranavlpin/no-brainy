import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebouncedDrafts } from '@/hooks/use-debounced-drafts'

describe('useDebouncedDrafts', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('saves once with the latest value after the delay and keeps the draft afterwards', () => {
    const save = vi.fn()
    const { result } = renderHook(() => useDebouncedDrafts<{ summaryMd: string }>(save, 600))
    act(() => result.current.change('summaryMd', 'F'))
    act(() => result.current.change('summaryMd', 'Fo'))
    act(() => result.current.change('summaryMd', 'Focus'))
    act(() => vi.advanceTimersByTime(599))
    expect(save).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith({ summaryMd: 'Focus' })
    expect(result.current.drafts.summaryMd).toBe('Focus')
  })

  it('debounces fields independently and flushes pending drafts on unmount', () => {
    const save = vi.fn()
    const { result, unmount } = renderHook(() =>
      useDebouncedDrafts<{ summaryMd: string; learningsMd: string }>(save, 600)
    )
    act(() => result.current.change('summaryMd', 'A'))
    act(() => vi.advanceTimersByTime(300))
    act(() => result.current.change('learningsMd', 'B'))
    act(() => vi.advanceTimersByTime(300))
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith({ summaryMd: 'A' })
    unmount()
    expect(save).toHaveBeenCalledTimes(2)
    expect(save).toHaveBeenLastCalledWith({ learningsMd: 'B' })
  })
})
