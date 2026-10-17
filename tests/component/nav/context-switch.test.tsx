import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/tasks',
}))

import { ContextSwitch } from '@/components/layout/context-switch'
import { useUIStore } from '@/stores/ui-store'

describe('ContextSwitch', () => {
  beforeEach(() => {
    useUIStore.getState().resetForTests()
    try {
      localStorage.removeItem('nobrainy-context')
    } catch {
      /* ignore */
    }
  })

  it('stores the chosen context and persists it for the next visit', async () => {
    render(<ContextSwitch />)
    const select = screen.getByRole('combobox', { name: /context/i })
    expect(select).toHaveValue('all')
    await userEvent.selectOptions(select, 'work')
    expect(useUIStore.getState().context).toBe('work')
    expect(localStorage.getItem('nobrainy-context')).toBe('"work"')
    useUIStore.getState().resetForTests()
    useUIStore.getState().hydrate()
    expect(useUIStore.getState().context).toBe('work')
  })
})
