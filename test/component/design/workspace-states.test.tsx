import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { ErrorState, LoadingState } from '@/components/ui/workspace-states'

it('keeps retry reachable and announces loading and errors', () => {
  const retry = vi.fn()
  const view = render(<LoadingState label="Loading projects" />)
  expect(screen.getByRole('status')).toHaveTextContent('Loading projects')
  view.rerender(<ErrorState retry={retry} />)
  expect(screen.getByRole('alert')).toHaveTextContent('Could not load')
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(retry).toHaveBeenCalledOnce()
})
