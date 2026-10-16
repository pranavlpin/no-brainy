import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '@/components/ui/button'

describe('shared button interaction', () => {
  it('supports keyboard activation and prevents activation while disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { rerender } = render(<Button onClick={onClick}>Save changes</Button>)
    await user.tab()
    expect(screen.getByRole('button', { name: 'Save changes' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledTimes(1)
    rerender(
      <Button disabled onClick={onClick}>
        Save changes
      </Button>
    )
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
