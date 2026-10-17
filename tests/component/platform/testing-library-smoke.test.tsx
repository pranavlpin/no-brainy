import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

function Hello({ name }: { name: string }) {
  return <p data-testid="hello">Hello, {name}</p>
}

describe('Testing Library setup', () => {
  it('renders a component under jsdom with jest-dom matchers', () => {
    render(<Hello name="Pranav" />)
    expect(screen.getByTestId('hello')).toBeInTheDocument()
    expect(screen.getByTestId('hello')).toHaveTextContent('Hello, Pranav')
  })
})
