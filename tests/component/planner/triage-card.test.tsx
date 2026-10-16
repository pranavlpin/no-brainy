import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TriageCard } from '@/components/planner/triage-card'
import type { TaskResponse } from '@/lib/types/tasks'

const task = (id: string, title: string): TaskResponse => ({
  id,
  userId: 'u1',
  parentTaskId: null,
  goalId: null,
  title,
  descriptionMd: '',
  priority: 'medium',
  status: 'pending',
  tags: [],
  dueDate: '2026-10-16T00:00:00.000Z',
  completedAt: null,
  isRecurring: false,
  rrule: null,
  quadrant: null,
  orderIndex: 0,
  plannedDate: null,
  estimatedMinutes: null,
  effort: null,
  context: null,
  createdAt: '2026-10-16T00:00:00.000Z',
  updatedAt: '2026-10-16T00:00:00.000Z',
})

describe('TriageCard', () => {
  it('renders a row per leftover and reports keep and drop decisions', async () => {
    const onTriage = vi.fn()
    render(
      <TriageCard
        tasks={[task('a', 'Alpha'), task('b', 'Beta')]}
        today="2026-10-17"
        onTriage={onTriage}
      />
    )
    expect(screen.getByTestId('triage-row-a')).toHaveTextContent('Alpha')
    await userEvent.click(screen.getByTestId('triage-keep-a'))
    expect(onTriage).toHaveBeenCalledWith({ taskId: 'a', action: 'keep' })
    await userEvent.click(screen.getByTestId('triage-drop-b'))
    expect(onTriage).toHaveBeenCalledWith({ taskId: 'b', action: 'drop' })
  })

  it('offers Tomorrow and Next Monday when moving', async () => {
    const onTriage = vi.fn()
    render(<TriageCard tasks={[task('a', 'Alpha')]} today="2026-10-17" onTriage={onTriage} />)
    await userEvent.click(screen.getByTestId('triage-move-a'))
    await userEvent.click(screen.getByTestId('triage-move-a-tomorrow'))
    expect(onTriage).toHaveBeenCalledWith({ taskId: 'a', action: 'move', date: '2026-10-18' })
    await userEvent.click(screen.getByTestId('triage-move-a'))
    await userEvent.click(screen.getByTestId('triage-move-a-next-monday'))
    expect(onTriage).toHaveBeenCalledWith({ taskId: 'a', action: 'move', date: '2026-10-19' })
  })

  it('renders nothing when there is nothing to triage', () => {
    const { container } = render(<TriageCard tasks={[]} today="2026-10-17" onTriage={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })
})
