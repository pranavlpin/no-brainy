import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { TaskForm } from '@/components/tasks/task-form'

vi.mock('@/hooks/use-projects', () => ({
  useProjects: () => ({ data: [{ id: 'p1', title: 'Launch' }] }),
}))
vi.mock('@/hooks/use-goals', () => ({ useGoals: () => ({ data: [{ id: 'g1', title: 'Craft' }] }) }))
vi.mock('@/components/editor/markdown-editor', () => ({ MarkdownEditor: () => null }))

it('allows a title alone, then exposes optional project, goal and independent calendar planning', () => {
  const submit = vi.fn()
  render(<TaskForm onSubmit={submit} submitLabel="Create Task" />)
  fireEvent.change(screen.getByLabelText('Title *'), {
    target: { value: 'Write a clear release note' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Create Task' }))
  expect(submit).toHaveBeenLastCalledWith(
    expect.objectContaining({ title: 'Write a clear release note' })
  )
  fireEvent.click(screen.getByRole('button', { name: 'Planning details' }))
  fireEvent.change(screen.getByLabelText('Project'), { target: { value: 'p1' } })
  fireEvent.change(screen.getByLabelText('Growth goal'), { target: { value: 'g1' } })
  fireEvent.change(screen.getByLabelText('Planned day'), { target: { value: '2026-10-20' } })
  fireEvent.change(screen.getByLabelText('Due Date'), { target: { value: '2026-10-23' } })
  fireEvent.change(screen.getByLabelText('Estimated minutes'), { target: { value: '45' } })
  fireEvent.click(screen.getByRole('button', { name: 'Create Task' }))
  expect(submit).toHaveBeenLastCalledWith(
    expect.objectContaining({
      projectId: 'p1',
      goalId: 'g1',
      plannedDate: '2026-10-20',
      dueDate: '2026-10-23',
      estimatedMinutes: 45,
    })
  )
})

it('keeps unsupported legacy recurrence visible and editable without reinterpreting it', () => {
  const submit = vi.fn()
  render(
    <TaskForm
      initialData={{ title: 'Legacy routine', isRecurring: true, rrule: 'FREQ=WEEKLY;BYDAY=MO,WE' }}
      onSubmit={submit}
    />
  )
  expect(screen.getByLabelText('Recurrence rule')).toHaveValue('FREQ=WEEKLY;BYDAY=MO,WE')
  expect(screen.getByText(/automatic repeats support daily, weekly or monthly/i)).toBeVisible()
  fireEvent.change(screen.getByLabelText('Recurrence rule'), {
    target: { value: 'FREQ=WEEKLY;BYDAY=FR' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  expect(submit).toHaveBeenCalledWith(expect.objectContaining({ rrule: 'FREQ=WEEKLY;BYDAY=FR' }))
})
