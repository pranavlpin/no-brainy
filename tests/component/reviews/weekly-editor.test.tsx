import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WeeklyEditor } from '@/components/reviews/weekly-editor'
import type { WeeklyReviewResponse } from '@/lib/types/reviews'

vi.mock('@/lib/api-client', () => ({ apiClient: vi.fn(() => new Promise(() => {})) }))
vi.mock('@/hooks/use-goals', () => ({ useGoals: () => ({ data: [], isLoading: false }) }))
vi.mock('@/hooks/use-tasks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/use-tasks')>()
  return {
    ...actual,
    useTasks: () => ({
      data: [{ id: 't1', title: 'Write the paper', status: 'pending', priority: 'high' }],
      isLoading: false,
    }),
  }
})

const review: WeeklyReviewResponse = {
  id: 'w1',
  userId: 'u1',
  weekStart: '2026-10-12',
  weekEnd: '2026-10-18',
  stopDoing: '',
  keepDoing: '',
  startTrying: '',
  reflectionMd: '',
  outcomes: [],
  nextTaskId: null,
  nextTask: null,
  closedAt: null,
  createdAt: '2026-10-12T00:00:00Z',
  updatedAt: '2026-10-16T10:00:00.000Z',
}

describe('WeeklyEditor', () => {
  it('keeps three outcome lines, shows the save state, and saves the assembled patch', async () => {
    const save = vi.fn(async (patch: Partial<WeeklyReviewResponse>) => ({
      ...review,
      ...patch,
      updatedAt: '2026-10-16T10:05:00.000Z',
    }))
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WeeklyEditor review={review} today="2026-10-16" save={save} reload={async () => review} />
      </QueryClientProvider>
    )
    expect(screen.getByTestId('weekly-review-2026-10-12')).toBeInTheDocument()
    for (const n of [1, 2, 3]) expect(screen.getByTestId(`week-outcome-${n}`)).toBeInTheDocument()
    expect(screen.getByTestId('save-status')).toHaveTextContent(/saved/i)
    await userEvent.type(screen.getByTestId('week-stop'), 'Checking email first')
    expect(screen.getByTestId('save-status')).toHaveTextContent(/unsaved|saving/i)
    await userEvent.type(screen.getByTestId('week-outcome-1'), 'Ship the planner')
    await userEvent.selectOptions(screen.getByTestId('week-next-action'), 't1')
    await waitFor(() => expect(save).toHaveBeenCalled(), { timeout: 3000 })
    const merged = Object.assign({}, ...save.mock.calls.map((c) => c[0]))
    expect(merged).toMatchObject({
      stopDoing: 'Checking email first',
      nextTaskId: 't1',
      outcomes: [{ id: 'first', text: 'Ship the planner' }],
    })
    await waitFor(() => expect(screen.getByTestId('save-status')).toHaveTextContent(/saved/i), {
      timeout: 3000,
    })
  })
})
