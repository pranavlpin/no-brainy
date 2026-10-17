import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let pathname = '/tasks'
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: vi.fn() }),
}))

import { BottomNav } from '@/components/layout/bottom-nav'
import { useCommandStore } from '@/stores/command-store'
import { useUIStore } from '@/stores/ui-store'

describe('BottomNav', () => {
  beforeEach(() => {
    pathname = '/tasks'
    useCommandStore.getState().reset()
    useUIStore.setState({ mobileSidebarOpen: false })
  })

  it('renders the five slots with the active tab marked', () => {
    render(<BottomNav />)
    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument()
    expect(screen.getByTestId('bottom-nav-/')).toBeInTheDocument()
    expect(screen.getByTestId('bottom-nav-/tasks')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('bottom-nav-/')).not.toHaveAttribute('aria-current')
    expect(screen.getByTestId('bottom-nav-/inbox')).toBeInTheDocument()
    expect(screen.getByTestId('capture-fab')).toBeInTheDocument()
    expect(screen.getByTestId('bottom-nav-menu')).toBeInTheDocument()
  })

  it('opens capture from the FAB and the drawer from Menu', async () => {
    render(<BottomNav />)
    await userEvent.click(screen.getByTestId('capture-fab'))
    expect(useCommandStore.getState().captureOpen).toBe(true)
    await userEvent.click(screen.getByTestId('bottom-nav-menu'))
    expect(useUIStore.getState().mobileSidebarOpen).toBe(true)
  })

  it('hides while a dialog is open', () => {
    useCommandStore.setState({ captureOpen: true })
    render(<BottomNav />)
    expect(screen.getByTestId('bottom-nav')).toHaveAttribute('data-hidden', 'true')
  })
})
