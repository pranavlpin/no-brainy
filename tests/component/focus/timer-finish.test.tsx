import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api-client', () => ({ apiClient: vi.fn(async () => ({ success: true, data: {} })) }))

import { PomodoroTimer } from '@/components/focus/pomodoro-timer'
import { useFocusStore } from '@/stores/focus-store'

describe('PomodoroTimer at zero', () => {
  beforeEach(() => useFocusStore.getState().reset())

  it('asks for the result instead of starting a break', async () => {
    const now = Date.now()
    useFocusStore
      .getState()
      .start(
        { kind: 'work', plannedSec: 60, taskId: 't1', taskTitle: 'Deep work', sessionId: 's1' },
        now - 61_000
      )
    render(
      <QueryClientProvider client={new QueryClient()}>
        <PomodoroTimer taskId="t1" taskTitle="Deep work" />
      </QueryClientProvider>
    )
    expect(await screen.findByTestId('focus-finish')).toBeInTheDocument()
    const state = useFocusStore.getState()
    expect(state.kind).toBe('work')
    expect(state.phase).not.toBe('running')
  })
})
