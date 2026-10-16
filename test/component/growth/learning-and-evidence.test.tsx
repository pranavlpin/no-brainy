import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { BookExperiment } from '@/components/growth/book-experiment'
import { EvidenceForm } from '@/components/growth/evidence-form'
const actions = vi.hoisted(() => ({ create: vi.fn(), save: vi.fn() }))
vi.mock('@/hooks/use-growth', () => ({
  useCreateGrowthAction: () => ({ mutateAsync: actions.create, isPending: false }),
  useSaveEvidence: () => ({ mutateAsync: actions.save, isPending: false }),
}))
vi.mock('@/hooks/use-goals', () => ({ useGoals: () => ({ data: [] }) }))
vi.mock('@/hooks/use-planner', () => ({
  useTodayPlan: () => ({ data: { planDate: '2026-10-16' }, isFetching: false }),
}))
beforeEach(() => {
  actions.create.mockReset()
  actions.save.mockReset()
})
it('turns an application note into a sourced planned experiment without an AI control', async () => {
  actions.create.mockResolvedValue({ id: 'experiment' })
  const user = userEvent.setup()
  render(
    <BookExperiment
      bookId="book-1"
      title="A useful book"
      application="Practise one clearer example"
    />
  )
  await user.click(screen.getByRole('button', { name: 'Turn into an experiment' }))
  expect(screen.getByLabelText('How will you try it? (optional)')).toHaveValue(
    'Practise one clearer example'
  )
  await user.click(screen.getByRole('button', { name: 'Plan for Today' }))
  await user.click(screen.getByRole('button', { name: 'Create action' }))
  expect(actions.create).toHaveBeenCalledWith(
    expect.objectContaining({
      sourceType: 'book',
      sourceId: 'book-1',
      plannedDate: '2026-10-16',
      description: 'Practise one clearer example',
    })
  )
  expect(screen.getByRole('link', { name: 'Open your experiment' })).toHaveAttribute(
    'href',
    '/tasks/experiment'
  )
})
it('retains failed evidence input and retries the same request identity', async () => {
  actions.save
    .mockRejectedValueOnce({ error: { message: 'Connection interrupted' } })
    .mockResolvedValueOnce({ id: 'evidence' })
  const saved = vi.fn()
  const user = userEvent.setup()
  render(<EvidenceForm goalId="goal-1" today="2026-10-16" onSaved={saved} />)
  await user.type(screen.getByLabelText('What did you observe?'), 'A more useful explanation')
  await user.type(screen.getByLabelText('Observed measurement'), '2')
  await user.click(screen.getByRole('button', { name: 'Save evidence' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Connection interrupted')
  expect(screen.getByLabelText('What did you observe?')).toHaveValue('A more useful explanation')
  await user.click(screen.getByRole('button', { name: 'Save evidence' }))
  expect(actions.save.mock.calls[1][0].clientRequestId).toBe(
    actions.save.mock.calls[0][0].clientRequestId
  )
  expect(saved).toHaveBeenCalledOnce()
})
