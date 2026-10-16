import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { UnfinishedWork } from '@/components/planner/unfinished-work'
import type { TaskResponse } from '@/lib/types/tasks'

const save = vi.hoisted(() => vi.fn().mockResolvedValue({ data: {} }))
vi.mock('@/hooks/use-tasks', () => ({
  useUpdateTask: () => ({ mutateAsync: save }),
  useCreateTask: () => ({ mutateAsync: vi.fn() }),
}))
const task = {
  id: 'old',
  title: 'An earlier commitment',
  dueDate: '2026-10-23T00:00:00Z',
  plannedDate: '2026-10-12',
  status: 'pending',
  priority: 'medium',
  tags: [],
} as unknown as TaskResponse

it('explicitly carries work forward without changing its deadline', async () => {
  render(<UnfinishedWork tasks={[task]} date="2026-10-20" />)
  fireEvent.click(screen.getByRole('button', { name: 'Continue today' }))
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith({ id: 'old', data: { plannedDate: '2026-10-20' } })
  )
  expect(save.mock.calls[0][0].data).not.toHaveProperty('dueDate')
})
