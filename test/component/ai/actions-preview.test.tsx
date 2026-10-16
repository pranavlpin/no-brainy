import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { it, expect, vi } from 'vitest'
import { ActionItemsPreview } from '@/components/ai/action-items-preview'
const save = vi.hoisted(() =>
  vi.fn().mockRejectedValueOnce(Error('Offline')).mockResolvedValue({ id: 'new' })
)
vi.mock('@/hooks/use-growth', () => ({ useCreateGrowthAction: () => ({ mutateAsync: save }) }))
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }))
it('edits proposed actions and keeps source links and request identity through retry', async () => {
  render(
    <ActionItemsPreview
      tasks={[{ title: 'Try this idea', priority: 'medium', reason: 'An experiment' }]}
      sourceType="book"
      sourceId="book-one"
      onClose={vi.fn()}
    />
  )
  fireEvent.change(screen.getByLabelText('Action title 1'), {
    target: { value: 'My own experiment' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Create 1 Task' }))
  await screen.findByRole('alert')
  fireEvent.click(screen.getByRole('button', { name: 'Retry remaining actions' }))
  await waitFor(() => expect(save).toHaveBeenCalledTimes(2))
  expect(save.mock.calls[0][0]).toMatchObject({
    title: 'My own experiment',
    sourceType: 'book',
    sourceId: 'book-one',
  })
  expect(save.mock.calls[1][0].clientRequestId).toBe(save.mock.calls[0][0].clientRequestId)
})
