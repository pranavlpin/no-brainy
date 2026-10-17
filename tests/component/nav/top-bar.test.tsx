import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { name: 'Pranav Owner' } }, status: 'authenticated' }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))
vi.mock('@/hooks/use-notifications', () => ({
  useUnreadCount: () => ({ data: 2 }),
  useNotifications: () => ({ data: { items: [] }, isLoading: false }),
  useMarkRead: () => ({ mutate: vi.fn() }),
  useMarkAllRead: () => ({ mutate: vi.fn() }),
}))

import { TopBar } from '@/components/layout/top-bar'
import { useUIStore } from '@/stores/ui-store'

describe('TopBar stacking', () => {
  beforeEach(() => {
    useUIStore.getState().resetForTests()
  })

  it('sits on its own layer above page content so its dropdowns are not covered', () => {
    render(<TopBar />)
    const bar = screen.getByTestId('top-bar')
    // backdrop-blur makes the bar a stacking context; without an explicit
    // layer, later page sections paint over anything the bar opens.
    expect(bar).toHaveClass('relative')
    expect(bar).toHaveClass('z-30')
  })

  it('opens the notification panel inside the bar', async () => {
    render(<TopBar />)
    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    const panel = screen.getByTestId('notification-panel')
    expect(screen.getByTestId('top-bar')).toContainElement(panel)
    expect(panel).toHaveTextContent('No notifications yet')
  })

  it('opens the user menu inside the bar', async () => {
    render(<TopBar />)
    await userEvent.click(screen.getByRole('button', { name: /Pranav Owner/ }))
    const menu = screen.getByTestId('user-menu-panel')
    expect(screen.getByTestId('top-bar')).toContainElement(menu)
    expect(menu).toHaveTextContent('Settings')
  })
})
