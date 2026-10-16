import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProjectForm } from '@/components/projects/project-form'

vi.mock('@/hooks/use-goals', () => ({
  useGoals: () => ({ data: [{ id: 'g1', title: 'Ship NoBrainy' }], isError: false, refetch: vi.fn() }),
}))

describe('ProjectForm', () => {
  it('needs a title and submits the outcome, context, and goal', async () => {
    const onSave = vi.fn(async () => undefined)
    render(<ProjectForm onSave={onSave} />)
    const submit = screen.getByRole('button', { name: /create project/i })
    expect(submit).toBeDisabled()
    await userEvent.type(screen.getByLabelText(/project name/i), 'Launch the course')
    await userEvent.type(screen.getByLabelText(/done look like/i), 'First cohort enrolled')
    await userEvent.selectOptions(screen.getByLabelText(/context/i), 'work')
    await userEvent.selectOptions(screen.getByLabelText(/goal/i), 'g1')
    expect(submit).toBeEnabled()
    await userEvent.click(submit)
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Launch the course',
        outcome: 'First cohort enrolled',
        context: 'work',
        goalId: 'g1',
      })
    )
  })
})
