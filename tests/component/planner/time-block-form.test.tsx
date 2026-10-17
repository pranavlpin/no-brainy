import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TimeBlockForm } from '@/components/planner/time-block-form'

describe('TimeBlockForm', () => {
  it('rejects an end before the start as a field error and submits a valid block', async () => {
    const onSave = vi.fn()
    render(<TimeBlockForm tasks={[]} onSave={onSave} />)
    await userEvent.type(screen.getByLabelText(/title/i), 'Deep work')
    const start = screen.getByLabelText(/start/i)
    const end = screen.getByLabelText(/end/i)
    await userEvent.clear(start)
    await userEvent.type(start, '14:00')
    await userEvent.clear(end)
    await userEvent.type(end, '13:00')
    await userEvent.click(screen.getByRole('button', { name: /add block/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/later than/i)
    expect(onSave).not.toHaveBeenCalled()

    await userEvent.clear(end)
    await userEvent.type(end, '15:30')
    await userEvent.click(screen.getByRole('button', { name: /add block/i }))
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave.mock.calls[0][0]).toMatchObject({
      title: 'Deep work',
      startTime: '14:00',
      endTime: '15:30',
      isCompleted: false,
    })
  })
})
