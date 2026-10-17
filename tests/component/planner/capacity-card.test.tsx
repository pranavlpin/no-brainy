import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CapacityCard } from '@/components/planner/capacity-card'

const task = (id: string, estimatedMinutes: number | null, priority = 'medium') => ({
  id,
  title: `Task ${id}`,
  estimatedMinutes,
  priority,
  status: 'pending',
})

describe('CapacityCard', () => {
  it('shows planned versus available and says when the day is over capacity', () => {
    render(
      <CapacityCard
        tasks={[task('a', 120), task('b', 90)]}
        blocks={[]}
        availableMinutes={180}
        bufferMinutes={15}
        workStart={null}
        workEnd={null}
        onChange={vi.fn()}
        onMoveTasks={vi.fn()}
      />
    )
    const summary = screen.getByTestId('capacity-summary')
    expect(summary).toHaveTextContent(/3h 45m/)
    expect(summary).toHaveTextContent(/3h/)
    expect(screen.getByRole('status')).toHaveTextContent(/over by 45m/i)
    expect(screen.getByRole('button', { name: /smaller day/i })).toBeInTheDocument()
  })

  it('keeps unknown estimates visible instead of counting them as zero', () => {
    render(
      <CapacityCard
        tasks={[task('a', 30), task('b', null), task('c', null)]}
        blocks={[]}
        availableMinutes={180}
        bufferMinutes={0}
        workStart={null}
        workEnd={null}
        onChange={vi.fn()}
        onMoveTasks={vi.fn()}
      />
    )
    expect(screen.getByRole('status')).toHaveTextContent(/2 tasks without an estimate/i)
    expect(screen.queryByRole('button', { name: /smaller day/i })).not.toBeInTheDocument()
  })

  it('reports capacity edits and moves the lowest-priority tasks to make a smaller day', async () => {
    const onChange = vi.fn()
    const onMoveTasks = vi.fn()
    render(
      <CapacityCard
        tasks={[task('a', 60, 'urgent'), task('b', 60, 'low'), task('c', 60, 'medium')]}
        blocks={[]}
        availableMinutes={120}
        bufferMinutes={0}
        workStart={null}
        workEnd={null}
        onChange={onChange}
        onMoveTasks={onMoveTasks}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /adjust/i }))
    const available = screen.getByLabelText(/available minutes/i)
    await userEvent.clear(available)
    await userEvent.type(available, '240')
    await userEvent.tab()
    expect(onChange).toHaveBeenLastCalledWith({ availableMinutes: 240 })
    await userEvent.click(screen.getByRole('button', { name: /smaller day/i }))
    // 180 planned against 120 available: moving the low-priority task is enough.
    expect(onMoveTasks).toHaveBeenCalledWith(['b'])
  })
})
