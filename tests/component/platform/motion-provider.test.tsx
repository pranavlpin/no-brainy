import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MotionProvider, FadeIn, StaggerList } from '@/components/motion'

describe('motion wrappers', () => {
  it('MotionProvider renders children', () => {
    render(
      <MotionProvider>
        <span>inside</span>
      </MotionProvider>
    )
    expect(screen.getByText('inside')).toBeInTheDocument()
  })

  it('FadeIn and StaggerList render their content', () => {
    render(
      <MotionProvider>
        <FadeIn data-testid="fade">a</FadeIn>
        <StaggerList data-testid="list">
          <li>one</li>
          <li>two</li>
        </StaggerList>
      </MotionProvider>
    )
    expect(screen.getByTestId('fade')).toHaveTextContent('a')
    expect(screen.getByTestId('list').querySelectorAll('li')).toHaveLength(2)
  })
})
