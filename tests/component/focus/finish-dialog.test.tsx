import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FinishDialog } from '@/components/focus/finish-dialog'

describe('FinishDialog', () => {
  it('offers three outcomes and passes the note and next action with the chosen one', async () => {
    const onFinish = vi.fn()
    render(
      <FinishDialog
        open
        taskTitle="Write the paper"
        elapsedSec={1500}
        isSaving={false}
        onFinish={onFinish}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByTestId('focus-finish')).toBeInTheDocument()
    for (const value of ['completed', 'progress', 'blocked']) {
      expect(screen.getByTestId(`focus-outcome-${value}`)).toBeInTheDocument()
    }
    await userEvent.type(screen.getByLabelText(/what happened/i), 'Intro drafted')
    await userEvent.type(screen.getByLabelText(/next action/i), 'Write the method section')
    await userEvent.click(screen.getByTestId('focus-outcome-progress'))
    expect(onFinish).toHaveBeenCalledWith({
      outcome: 'progress',
      reflection: 'Intro drafted',
      nextAction: 'Write the method section',
    })
  })
})
