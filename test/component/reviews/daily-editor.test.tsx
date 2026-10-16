import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { it, expect, vi } from 'vitest'
import { DailyEditor } from '@/components/reviews/daily-editor'
import type { DailyReviewDetail } from '@/lib/types/reviews'
const storage = vi.hoisted(() => {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
})
vi.stubGlobal('localStorage', storage)
vi.mock('@/hooks/use-ai', () => ({ useAI: () => ({ isEnabled: true }) }))
vi.mock('@/hooks/use-review-ai', () => ({
  useReviewAISummary: () => ({
    isPending: false,
    mutateAsync: async () => ({ data: { summaryMd: 'A separate observation' } }),
  }),
}))
vi.mock('@/hooks/use-tasks', () => ({
  useUpdateTask: () => ({ mutateAsync: vi.fn() }),
  useCreateTask: () => ({ mutateAsync: vi.fn() }),
}))
const review = {
  id: 'review-fixture',
  userId: 'review-owner',
  reviewDate: '2026-10-12',
  updatedAt: '2026-10-12T10:00:00Z',
  whatMoved: '',
  blockers: '',
  reflectionMd: 'Original reflection',
  aiSummaryMd: null,
  mood: null,
  tomorrowTaskId: null,
  closedAt: null,
  activity: {
    completedTasks: [],
    unfinishedTasks: [],
    focusSessions: [],
    focusSeconds: 0,
    notesCreated: 0,
    cardsReviewed: 0,
  },
  today: '2026-10-16',
  timezone: 'Asia/Kolkata',
} as unknown as DailyReviewDetail
it('keeps all responses after a failed close, permits no mood and separates AI preview from writing', async () => {
  const save = vi
    .fn()
    .mockRejectedValueOnce(Error('Offline'))
    .mockImplementation(async (patch) => ({
      ...review,
      ...patch,
      updatedAt: '2026-10-12T11:00:00Z',
    }))
  render(<DailyEditor review={review} save={save} reload={async () => review} />)
  await waitFor(() => expect(screen.getByLabelText('What moved forward?')).toBeEnabled())
  fireEvent.change(screen.getByLabelText('What moved forward?'), {
    target: { value: 'One useful step' },
  })
  fireEvent.change(screen.getByLabelText('What got in the way?'), {
    target: { value: 'Interruptions' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Close this day' }))
  await screen.findByText('Could not save. Your draft is retained.')
  expect(screen.getByLabelText('What moved forward?')).toHaveValue('One useful step')
  expect(screen.getByLabelText('What got in the way?')).toHaveValue('Interruptions')
  fireEvent.click(screen.getByRole('button', { name: 'Retry save' }))
  await screen.findByText('Day closed. You can return whenever you need.')
  expect(save.mock.calls.at(-1)?.[0]).not.toHaveProperty('mood')
  fireEvent.click(screen.getByRole('button', { name: 'Preview an AI recap' }))
  await screen.findByText('A separate observation')
  expect(screen.getByLabelText('Longer reflection (optional)')).toHaveValue('Original reflection')
  expect(save.mock.calls.some(([patch]) => 'aiSummaryMd' in patch)).toBe(false)
})
