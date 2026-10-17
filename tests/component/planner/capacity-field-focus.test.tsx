import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CapacityCard } from '@/components/planner/capacity-card'

const task = (id: string, estimatedMinutes: number | null) => ({
  id,
  title: `Task ${id}`,
  estimatedMinutes,
  priority: 'medium',
  status: 'pending',
})

function card(bufferMinutes: number, onChange = vi.fn()) {
  return (
    <CapacityCard
      tasks={[task('a', 60)]}
      blocks={[]}
      availableMinutes={180}
      bufferMinutes={bufferMinutes}
      workStart={null}
      workEnd={null}
      onChange={onChange}
      onMoveTasks={vi.fn()}
    />
  )
}

describe('CapacityCard number fields', () => {
  it('keeps a half-typed value when the server value changes underneath, then commits it on blur', async () => {
    const onChange = vi.fn()
    const { rerender } = render(card(15, onChange))
    await userEvent.click(screen.getByRole('button', { name: /adjust/i }))
    const buffer = screen.getByLabelText('Buffer minutes') as HTMLInputElement
    await userEvent.clear(buffer)
    await userEvent.type(buffer, '2')
    expect(buffer.value).toBe('2')

    // A background refetch lands while the field is still focused.
    rerender(card(20, onChange))
    expect(buffer.value).toBe('2')

    await userEvent.tab()
    expect(onChange).toHaveBeenLastCalledWith({ bufferMinutes: 2 })
  })
})
