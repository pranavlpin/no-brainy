import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Toast } from '@/components/ui/toast'
import { useToast } from '@/hooks/use-toast'

describe('Toast stack', () => {
  beforeEach(() => {
    useToast.getState().clear()
  })

  it('renders a status region with one item per toast', () => {
    render(<Toast />)
    let a = ''
    let b = ''
    act(() => {
      a = useToast.getState().show('Saved')
      b = useToast.getState().show('Failed', 'error')
    })
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByTestId(`toast-${a}`)).toHaveTextContent('Saved')
    expect(screen.getByTestId(`toast-${b}`)).toHaveTextContent('Failed')
  })
})
