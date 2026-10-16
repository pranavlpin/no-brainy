import { fireEvent, render, screen } from '@testing-library/react'
import { it, expect, vi } from 'vitest'
import { AISuggestPanel } from '@/components/planner/ai-suggest-panel'
import type { TaskResponse } from '@/lib/types/tasks'
vi.mock('@/components/editor/markdown-preview', () => ({
  MarkdownPreview: ({ content }: { content: string }) => <p>{content}</p>,
}))
const tasks = [
  { id: 'a', title: 'Actual task title', priority: 'high', status: 'pending', dueDate: null },
  { id: 'b', title: 'Another action', priority: 'medium', status: 'in_progress', dueDate: null },
] as TaskResponse[]
it('allows editing and explicit acceptance using real task labels, without applying dismissal', () => {
  const accept = vi.fn(),
    dismiss = vi.fn()
  render(
    <AISuggestPanel
      suggestion={{
        suggestedTaskIds: ['a', 'b'],
        reasoning: 'A possibility',
        briefMd: 'An initial preview',
      }}
      allTasks={tasks}
      onAccept={accept}
      onDismiss={dismiss}
    />
  )
  expect(screen.getByText('Actual task title')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('checkbox', { name: 'Plan Another action' }))
  fireEvent.change(screen.getByLabelText('Edit planning brief'), {
    target: { value: 'My own plan' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Accept Suggestions' }))
  expect(accept).toHaveBeenCalledWith(['a'], 'My own plan')
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
  expect(dismiss).toHaveBeenCalledTimes(1)
  expect(accept).toHaveBeenCalledTimes(1)
})
it('makes unresolved task references visible and prevents acceptance', () => {
  render(
    <AISuggestPanel
      suggestion={{
        suggestedTaskIds: ['missing'],
        reasoning: 'A possibility',
        briefMd: 'A preview',
      }}
      allTasks={tasks}
      onAccept={vi.fn()}
      onDismiss={vi.fn()}
    />
  )
  expect(screen.getByRole('button', { name: 'Accept Suggestions' })).toBeDisabled()
  expect(screen.getByRole('alert')).toHaveTextContent('no longer available')
})
