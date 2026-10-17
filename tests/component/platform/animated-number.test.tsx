import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnimatedNumber } from '@/components/motion/animated-number'

function mockReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('AnimatedNumber', () => {
  beforeEach(() => mockReducedMotion(true))
  afterEach(() => mockReducedMotion(false))

  it('renders the final formatted value immediately under reduced motion', () => {
    render(<AnimatedNumber value={1234} data-testid="n" />)
    expect(screen.getByTestId('n')).toHaveTextContent('1,234')
  })

  it('accepts a custom formatter', () => {
    render(<AnimatedNumber value={42} format={(v) => `${Math.round(v)}%`} data-testid="p" />)
    expect(screen.getByTestId('p')).toHaveTextContent('42%')
  })
})
