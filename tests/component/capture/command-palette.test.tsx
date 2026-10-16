import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => '/',
}))
vi.mock('@/lib/api-client', () => ({ apiClient: vi.fn(() => new Promise(() => {})) }))

import { CommandPalette } from '@/components/command-palette/command-palette'
import { ShortcutsProvider } from '@/components/command-palette/shortcuts-provider'
import { useCommandStore } from '@/stores/command-store'

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient()
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('CommandPalette', () => {
  beforeEach(() => {
    push.mockReset()
    useCommandStore.getState().reset()
  })

  it('filters navigation items and navigates on Enter', async () => {
    const onOpenChange = vi.fn()
    wrap(<CommandPalette open onOpenChange={onOpenChange} />)
    expect(screen.getByTestId('command-palette')).toBeInTheDocument()
    const input = screen.getByPlaceholderText(/type a command/i)
    await userEvent.type(input, 'plann')
    expect(screen.getByTestId('palette-item-nav-/planner')).toBeInTheDocument()
    expect(screen.queryByTestId('palette-item-nav-/books')).toBeNull()
    await userEvent.keyboard('{Enter}')
    expect(push).toHaveBeenCalledWith('/planner')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('exposes actions such as starting the review', async () => {
    wrap(<CommandPalette open onOpenChange={() => {}} />)
    await userEvent.type(screen.getByPlaceholderText(/type a command/i), 'close the day')
    await userEvent.click(screen.getByTestId('palette-item-action-close-day'))
    expect(push).toHaveBeenCalledWith('/reviews/daily')
  })
})

describe('ShortcutsProvider', () => {
  beforeEach(() => useCommandStore.getState().reset())

  it('opens the palette on mod+k and capture on c, but not while typing', () => {
    render(
      <ShortcutsProvider>
        <input data-testid="field" />
      </ShortcutsProvider>
    )
    fireEvent.keyDown(document.body, { key: 'k', metaKey: true })
    expect(useCommandStore.getState().paletteOpen).toBe(true)
    useCommandStore.getState().reset()

    fireEvent.keyDown(document.body, { key: 'c' })
    expect(useCommandStore.getState().captureOpen).toBe(true)
    useCommandStore.getState().reset()

    fireEvent.keyDown(screen.getByTestId('field'), { key: 'c' })
    expect(useCommandStore.getState().captureOpen).toBe(false)
  })

  it('supports g-then-key go-to chords', () => {
    render(<ShortcutsProvider />)
    fireEvent.keyDown(document.body, { key: 'g' })
    fireEvent.keyDown(document.body, { key: 't' })
    expect(push).toHaveBeenCalledWith('/tasks')
  })
})
