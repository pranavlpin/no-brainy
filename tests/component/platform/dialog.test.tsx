import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Dialog } from '@/components/ui/dialog'

describe('Dialog', () => {
  it('renders nothing when closed', () => {
    render(<Dialog open={false} onClose={() => {}} title="Hidden" />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders an accessible dialog with title, description, and children when open', () => {
    render(
      <Dialog open onClose={() => {}} title="Delete note" description="This cannot be undone.">
        <p>Body</p>
      </Dialog>
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAccessibleName('Delete note')
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
    expect(screen.getByTestId('dialog-panel')).toBeInTheDocument()
  })

  it('calls onClose on Escape and onConfirm on the confirm button', async () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    render(
      <Dialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        title="Remove key"
        confirmLabel="Remove"
        variant="destructive"
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
