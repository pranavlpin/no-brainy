import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { QuickCaptureModal } from '@/components/quick-capture/quick-capture-modal'

const mocks = vi.hoisted(() => {
  const values = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
    },
  })
  return { save: vi.fn(), convert: vi.fn() }
})
vi.mock('@/hooks/use-auth', () => ({ useAuth: () => ({ user: { id: 'capture-owner' } }) }))
vi.mock('@/hooks/use-inbox', () => ({
  useCreateCapture: () => ({ mutateAsync: mocks.save }),
  useProcessCapture: () => ({ mutateAsync: mocks.convert }),
}))
vi.mock('@/hooks/use-notes', () => ({ useCreateNote: () => ({ mutateAsync: mocks.save }) }))
vi.mock('@/hooks/use-tasks', () => ({ useCreateTask: () => ({ mutateAsync: mocks.save }) }))
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ show: vi.fn() }) }))
beforeEach(() => {
  localStorage.clear()
  mocks.save.mockReset()
  mocks.convert.mockReset()
})

it('saves unclassified input with stable identity, retaining a failed draft until explicit retry succeeds', async () => {
  mocks.save.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce({ id: 'capture-1' })
  const close = vi.fn()
  render(<QuickCaptureModal open onClose={close} />)
  fireEvent.change(screen.getByLabelText('Capture text'), {
    target: { value: 'An unclassified thought' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save to Inbox' }))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/kept|retry/i))
  expect(screen.getByLabelText('Capture text')).toHaveValue('An unclassified thought')
  expect(close).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Retry save' }))
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1))
  expect(mocks.save.mock.calls[0][0]).toEqual(mocks.save.mock.calls[1][0])
  expect(mocks.convert).not.toHaveBeenCalled()
})

it('restores a draft after close and remount without calling it server-saved', () => {
  const first = render(<QuickCaptureModal open onClose={() => {}} />)
  fireEvent.change(screen.getByLabelText('Capture text'), {
    target: { value: 'Keep this for later' },
  })
  first.unmount()
  render(<QuickCaptureModal open onClose={() => {}} />)
  expect(screen.getByLabelText('Capture text')).toHaveValue('Keep this for later')
  expect(screen.getByRole('status')).toHaveTextContent(/on this device/i)
})

it('keeps storage-failure messaging accurate after closing and reopening the in-memory draft', () => {
  const write = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
    throw new Error('Storage blocked')
  })
  const first = render(<QuickCaptureModal open onClose={() => {}} />)
  fireEvent.change(screen.getByLabelText('Capture text'), {
    target: { value: 'Memory is still useful' },
  })
  expect(screen.getByRole('status')).toHaveTextContent(/storage is unavailable/i)
  first.unmount()
  render(<QuickCaptureModal open onClose={() => {}} />)
  expect(screen.getByLabelText('Capture text')).toHaveValue('Memory is still useful')
  expect(screen.getByRole('status')).toHaveTextContent(/storage is unavailable/i)
  write.mockRestore()
})
