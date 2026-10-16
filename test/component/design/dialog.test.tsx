import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { Dialog } from '@/components/ui/dialog'

function Example() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Open editor</button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Edit project" onConfirm={() => {}}>
        <label>
          Project name
          <input autoFocus />
        </label>
      </Dialog>
    </>
  )
}

it('provides a named dialog, contains keyboard focus, dismisses and restores the trigger', async () => {
  const user = userEvent.setup()
  render(<Example />)
  await user.click(screen.getByRole('button', { name: 'Open editor' }))
  expect(screen.getByRole('dialog', { name: 'Edit project' })).toHaveAttribute('aria-modal', 'true')
  expect(screen.getByLabelText('Project name')).toHaveFocus()
  screen.getByRole('button', { name: 'Confirm' }).focus()
  await user.tab()
  expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement)
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Open editor' })).toHaveFocus()
})
