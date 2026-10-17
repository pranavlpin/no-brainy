import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/ui/workspace-states'

describe('workspace states', () => {
  it('PageHeader renders the eyebrow, display title, description, and actions', () => {
    render(
      <PageHeader eyebrow="Do" title="Tasks" description="Everything with a next step.">
        <button>New task</button>
      </PageHeader>
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Tasks' })).toHaveClass('display-title')
    expect(screen.getByText('Do')).toHaveClass('eyebrow')
    expect(screen.getByText('Everything with a next step.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New task' })).toBeInTheDocument()
  })

  it('LoadingState announces once, ErrorState offers retry, EmptyState offers one action', async () => {
    const retry = vi.fn()
    const act = vi.fn()
    render(
      <>
        <LoadingState label="Loading tasks" />
        <ErrorState retry={retry} message="Tasks could not load." />
        <EmptyState
          title="Nothing here"
          description="Capture the first one."
          action="Capture"
          onAction={act}
        />
      </>
    )
    expect(screen.getByRole('status')).toHaveTextContent('Loading tasks')
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Tasks could not load.')
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(retry).toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Capture' }))
    expect(act).toHaveBeenCalled()
  })
})
