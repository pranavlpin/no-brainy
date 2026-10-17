import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BookExperiment } from '@/components/growth/book-experiment'

const create = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/use-tasks', () => ({ useCreateTask: () => ({ mutateAsync: create, isPending: false }) }))
vi.mock('@/hooks/use-goals', () => ({
  useGoals: () => ({ data: [{ id: 'g1', title: 'Build better habits' }], isError: false, refetch: vi.fn() }),
}))
vi.mock('@/hooks/use-user-today', () => ({ useUserToday: () => ({ today: '2026-10-16', timezone: 'Asia/Kolkata' }) }))

describe('BookExperiment', () => {
  it('opens a composer with the book as the source and creates a sourced experiment task', async () => {
    create.mockResolvedValue({ data: { id: 't1', title: 'Try one idea from Atomic Habits' } })
    render(<BookExperiment bookId="b1" title="Atomic Habits" application="Stack a two-minute habit onto my morning coffee." />)
    await userEvent.click(screen.getByRole('button', { name: /turn into an experiment/i }))
    const composer = await screen.findByTestId('book-experiment-composer')
    expect(composer).toHaveTextContent(/atomic habits/i)
    expect(screen.getByLabelText(/experiment/i)).toHaveValue('Try one idea from Atomic Habits')
    await userEvent.selectOptions(screen.getByLabelText(/goal/i), 'g1')
    await userEvent.click(screen.getByRole('button', { name: /create experiment/i }))
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Try one idea from Atomic Habits',
          goalId: 'g1',
          tags: expect.arrayContaining(['experiment']),
          descriptionMd: expect.stringContaining('two-minute habit'),
        })
      )
    )
  })
})
