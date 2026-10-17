import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SaveStatus } from '@/components/ui/save-status'

describe('SaveStatus', () => {
  it('reads each state and exposes recovery actions', async () => {
    const retry = vi.fn()
    const resolve = vi.fn(async () => {})
    const { rerender } = render(
      <SaveStatus state="saved" durable retry={retry} resolve={resolve} />
    )
    expect(screen.getByTestId('save-status')).toHaveTextContent('Saved')
    rerender(<SaveStatus state="pending" durable retry={retry} resolve={resolve} />)
    expect(screen.getByTestId('save-status')).toHaveTextContent(/unsaved/i)
    rerender(<SaveStatus state="error" durable retry={retry} resolve={resolve} />)
    await userEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(retry).toHaveBeenCalled()
    rerender(<SaveStatus state="conflict" durable retry={retry} resolve={resolve} />)
    await userEvent.click(screen.getByRole('button', { name: /keep my/i }))
    expect(resolve).toHaveBeenCalledWith(true)
  })

  it('warns when browser storage is unavailable', () => {
    render(<SaveStatus state="pending" durable={false} retry={() => {}} resolve={async () => {}} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/storage/i)
  })
})
