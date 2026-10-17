import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card } from '@/components/ui/card'

describe('Card', () => {
  it('defaults to the glass surface and passes through test ids', () => {
    render(<Card data-testid="c">hi</Card>)
    const el = screen.getByTestId('c')
    expect(el.className).toContain('surface-glass')
    expect(el).toHaveTextContent('hi')
  })

  it('applies solid and outline variants', () => {
    const { rerender } = render(<Card variant="solid" data-testid="c" />)
    expect(screen.getByTestId('c').className).toContain('surface-solid')
    rerender(<Card variant="outline" data-testid="c" />)
    expect(screen.getByTestId('c').className).toContain('surface-outline')
  })
})
