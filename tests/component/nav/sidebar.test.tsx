import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let pathname = '/'
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: vi.fn() }),
}))
const badges = vi.fn(() => ({ data: { cardsDue: 0, overdueTasks: 0, unreadNotifications: 0 } }))
vi.mock('@/hooks/use-nav-badges', () => ({ useNavBadges: () => badges() }))

import { Sidebar } from '@/components/layout/sidebar'
import { useUIStore } from '@/stores/ui-store'

describe('Sidebar (grouped)', () => {
  beforeEach(() => {
    pathname = '/'
    useUIStore.setState({ collapsedGroups: [], hiddenNavItems: [], sidebarCollapsed: false })
    badges.mockReturnValue({ data: { cardsDue: 0, overdueTasks: 0, unreadNotifications: 0 } })
  })

  it('renders group headers and marks the active item', () => {
    render(<Sidebar />)
    expect(screen.getByTestId('nav-group-do')).toBeInTheDocument()
    expect(screen.getByTestId('nav-group-learn')).toBeInTheDocument()
    expect(screen.getByTestId('nav-item-/')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('nav-item-/tasks')).not.toHaveAttribute('aria-current')
  })

  it('collapses a group and hides its items', async () => {
    render(<Sidebar />)
    const header = screen.getByTestId('nav-group-learn')
    expect(header).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'false')
    // Items leave with a short collapse animation.
    await waitFor(() => expect(screen.queryByTestId('nav-item-/books')).toBeNull())
    expect(useUIStore.getState().collapsedGroups).toContain('learn')
  })

  it('respects hidden items and shows badges', () => {
    useUIStore.setState({ hiddenNavItems: ['/watchlist'] })
    badges.mockReturnValue({ data: { cardsDue: 12, overdueTasks: 3, unreadNotifications: 0 } })
    render(<Sidebar />)
    expect(screen.queryByTestId('nav-item-/watchlist')).toBeNull()
    expect(screen.getByTestId('nav-badge-/flashcards')).toHaveTextContent('12')
    expect(screen.getByTestId('nav-badge-/tasks')).toHaveTextContent('3')
  })
})
