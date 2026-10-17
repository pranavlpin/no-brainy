import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// next/script renders nothing meaningful in jsdom; stub it so we can count tags.
vi.mock('next/script', () => ({
  default: (props: { id?: string; src?: string }) => (
    <script data-ga id={props.id} src={props.src} />
  ),
}))

import { GoogleAnalytics } from '@/components/analytics-scripts'

describe('GoogleAnalytics', () => {
  it('renders nothing at all for an empty or missing id (no stray text nodes)', () => {
    const a = render(<GoogleAnalytics gaId="" />)
    expect(a.container.childNodes).toHaveLength(0)
    const b = render(<GoogleAnalytics gaId={undefined} />)
    expect(b.container.childNodes).toHaveLength(0)
  })

  it('renders the loader and config scripts for a real id', () => {
    const { container } = render(<GoogleAnalytics gaId="G-TEST123" />)
    const scripts = container.querySelectorAll('script[data-ga]')
    expect(scripts).toHaveLength(2)
    expect(scripts[0].getAttribute('src')).toContain('G-TEST123')
  })
})
