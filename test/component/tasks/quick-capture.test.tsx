import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { QuickCaptureModal } from '@/components/quick-capture/quick-capture-modal'

const save = vi.hoisted(() => vi.fn(() => new Promise(() => {})))
vi.mock('@/hooks/use-notes', () => ({ useCreateNote: () => ({ mutateAsync: save }) }))
vi.mock('@/hooks/use-tasks', () => ({ useCreateTask: () => ({ mutateAsync: save }) }))
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ show: vi.fn() }) }))
vi.mock('@/hooks/use-auth', () => ({ useAuth: () => ({ user: { id: 'quick-capture-test' } }) }))
vi.mock('@/hooks/use-inbox', () => ({
  useCreateCapture: () => ({ mutateAsync: save }),
  useProcessCapture: () => ({ mutateAsync: save }),
}))

it('prevents repeated Enter from creating duplicate captures before state updates', () => {
  render(<QuickCaptureModal open onClose={() => {}} />)
  const input = screen.getByLabelText('Capture text')
  fireEvent.change(input, { target: { value: 'One capture' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(save).toHaveBeenCalledTimes(1)
})
