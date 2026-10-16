import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { TopBar } from '@/components/layout/top-bar'

vi.mock('@/stores/ui-store', () => ({
  useUIStore: () => ({ setMobileSidebarOpen: vi.fn(), context: 'all', setContext: vi.fn() }),
}))
vi.mock('@/stores/dark-mode-store', () => ({
  useDarkModeStore: () => ({ isDark: false, toggle: vi.fn() }),
}))
vi.mock('@/components/layout/breadcrumbs', () => ({ Breadcrumbs: () => null }))
vi.mock('@/components/layout/user-menu', () => ({ UserMenu: () => null }))
vi.mock('@/components/notifications/notification-bell', () => ({ NotificationBell: () => null }))

it('offers visible, named capture and mobile navigation controls', () => {
  render(<TopBar />)
  expect(screen.getByRole('button', { name: 'Capture' })).toBeVisible()
  expect(screen.getByRole('button', { name: 'Open navigation' })).toBeInTheDocument()
})
