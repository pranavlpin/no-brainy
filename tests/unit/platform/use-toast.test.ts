import { beforeEach, describe, expect, it } from 'vitest'
import { useToast } from '@/hooks/use-toast'

describe('useToast store (stacked)', () => {
  beforeEach(() => {
    useToast.getState().clear()
  })

  it('keeps the two-argument show(message, type) signature and returns an id', () => {
    const id = useToast.getState().show('Saved', 'success')
    expect(typeof id).toBe('string')
    const { toasts } = useToast.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0]).toMatchObject({ id, message: 'Saved', type: 'success' })
  })

  it('defaults type to success and gives errors a longer duration', () => {
    useToast.getState().show('Plain')
    useToast.getState().show('Boom', 'error')
    const [plain, boom] = useToast.getState().toasts
    expect(plain.type).toBe('success')
    expect(plain.durationMs).toBe(3500)
    expect(boom.durationMs).toBe(6000)
  })

  it('stacks at most three toasts, dropping the oldest', () => {
    const s = useToast.getState()
    s.show('one')
    s.show('two')
    s.show('three')
    s.show('four')
    const messages = useToast.getState().toasts.map((t) => t.message)
    expect(messages).toEqual(['two', 'three', 'four'])
  })

  it('dismisses by id and supports an optional action', () => {
    let clicked = false
    const id = useToast.getState().show('Undo?', 'success', {
      action: { label: 'Undo', onClick: () => (clicked = true) },
    })
    useToast.getState().toasts[0].action?.onClick()
    expect(clicked).toBe(true)
    useToast.getState().dismiss(id)
    expect(useToast.getState().toasts).toHaveLength(0)
  })
})
