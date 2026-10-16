import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { Toast } from '@/components/ui/toast'

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ message: 'Saved to your workspace', type: 'success', hide: vi.fn() }),
}))
it('announces confirmed feedback without requiring sight', () => {
  render(<Toast />)
  expect(screen.getByRole('status')).toHaveTextContent('Saved to your workspace')
})
