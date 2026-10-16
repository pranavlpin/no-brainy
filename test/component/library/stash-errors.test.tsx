import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { it, expect, vi } from 'vitest'
import { StashComposer } from '@/components/features/stash/stash-composer'
const send = vi.hoisted(() => vi.fn().mockRejectedValue(Error('Connection failed')))
vi.mock('@/hooks/use-stash', () => ({
  useSendMessage: () => ({ mutateAsync: send, isPending: false }),
}))
it('retains a failed message with visible retry guidance and clears it when switching channels', async () => {
  const { rerender } = render(<StashComposer channelId="one" />)
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'Private note in channel one' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Send' }))
  await screen.findByRole('alert')
  expect(screen.getByRole('textbox')).toHaveValue('Private note in channel one')
  rerender(<StashComposer channelId="two" />)
  await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(''))
  expect(screen.queryByRole('alert')).toBeNull()
})
it('does not clear a new channel draft when an earlier send finishes', async () => {
  let resolve!: () => void
  send.mockImplementationOnce(
    () =>
      new Promise<void>((done) => {
        resolve = done
      })
  )
  const { rerender } = render(<StashComposer channelId="earlier" />)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Earlier message' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send' }))
  rerender(<StashComposer channelId="current" />)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Current draft' } })
  await act(async () => resolve())
  expect(screen.getByRole('textbox')).toHaveValue('Current draft')
})
it('does not show an earlier channel failure in the current channel', async () => {
  let reject!: (error: Error) => void
  send.mockImplementationOnce(
    () =>
      new Promise<void>((_, fail) => {
        reject = fail
      })
  )
  const { rerender } = render(<StashComposer channelId="earlier" />)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Earlier message' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send' }))
  rerender(<StashComposer channelId="current" />)
  await act(async () => reject(Error('Connection failed')))
  expect(screen.queryByRole('alert')).toBeNull()
})
