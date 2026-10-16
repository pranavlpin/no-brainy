import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

let pathname = '/'
vi.mock('next/navigation', () => ({ usePathname: () => pathname }))

import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { useBreadcrumbTitle } from '@/stores/breadcrumb-store'

describe('Breadcrumbs', () => {
  it('labels every module and the root', () => {
    pathname = '/'
    const { unmount } = render(<Breadcrumbs />)
    expect(screen.getByTestId('breadcrumbs')).toHaveTextContent('Today')
    unmount()
    pathname = '/budgets'
    render(<Breadcrumbs />)
    expect(screen.getByTestId('breadcrumbs')).toHaveTextContent('Budgets')
  })

  it('shows an entity title for detail pages when provided', () => {
    pathname = '/notes/abc123'
    useBreadcrumbTitle.getState().setTitle('Weekly review notes')
    render(<Breadcrumbs />)
    expect(screen.getByTestId('breadcrumbs')).toHaveTextContent('Notes')
    expect(screen.getByTestId('breadcrumbs')).toHaveTextContent('Weekly review notes')
    expect(screen.getByTestId('breadcrumbs')).not.toHaveTextContent('abc123')
    useBreadcrumbTitle.getState().setTitle(null)
  })
})
