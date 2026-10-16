import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { IntentCard } from '@/components/planner/intent-card'

describe('IntentCard', () => {
  it('shows the intent and lets it become a task', async () => {
    const onMakeTask = vi.fn()
    render(<IntentCard intent="Finish the Today page" onSave={vi.fn()} onMakeTask={onMakeTask} />)
    expect(screen.getByTestId('intent-card')).toHaveTextContent('Finish the Today page')
    await userEvent.click(screen.getByTestId('intent-make-task'))
    expect(onMakeTask).toHaveBeenCalledWith('Finish the Today page')
  })

  it('shows an empty prompt and saves typed text on Enter', async () => {
    const onSave = vi.fn()
    render(<IntentCard intent={null} onSave={onSave} onMakeTask={vi.fn()} />)
    await userEvent.click(screen.getByTestId('intent-edit'))
    await userEvent.type(screen.getByTestId('intent-input'), 'Write three tests{enter}')
    expect(onSave).toHaveBeenCalledWith('Write three tests')
  })
})
