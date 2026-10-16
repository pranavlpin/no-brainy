import { useState } from 'react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { AppShell } from '@/components/layout/app-shell'
import { useUIStore } from '@/stores/ui-store'
const focus = vi.hoisted(() => ({
  active: {
    id: 'session-1',
    taskId: 'task-1',
    taskTitle: 'Small deliberate step',
    state: 'paused',
  } as { id: string; taskId: string; taskTitle: string; state: string } | null,
  pending: null as object | null,
  setup: { taskId: 'task-1' },
  remaining: 1230,
}))
vi.mock('@/hooks/use-focus', () => ({
  FocusProvider: ({ children }: { children: React.ReactNode }) => children,
  useFocus: () => focus,
}))
vi.mock('next/navigation', () => ({ usePathname: () => '/today' }))
vi.mock('@/components/layout/sidebar', () => ({ Sidebar: () => null }))
vi.mock('@/components/layout/top-bar', () => ({ TopBar: () => null }))
vi.mock('@/components/ui/toast', () => ({ Toast: () => null }))
vi.mock('@/components/quick-capture/quick-capture-provider', () => ({
  QuickCaptureProvider: () => null,
}))
vi.mock('@/components/focus/focus-mode-view', () => ({
  FocusModeView: () => <section aria-label="Focus workspace">Focus workspace</section>,
}))
beforeEach(() => useUIStore.setState({ focusMode: false, focusTaskId: null }))
function Draft() {
  const [value, setValue] = useState('')
  return <input aria-label="Day draft" value={value} onChange={(e) => setValue(e.target.value)} />
}
it('keeps the current page mounted behind Focus and restores its unsaved input on exit', async () => {
  const user = userEvent.setup()
  render(
    <AppShell>
      <Draft />
    </AppShell>
  )
  await user.type(screen.getByLabelText('Day draft'), 'A small intention')
  await user.click(screen.getByRole('button', { name: 'Open focus session' }))
  expect(screen.getByRole('region', { name: 'Focus workspace' })).toBeVisible()
  expect(screen.getByLabelText('Day draft')).not.toBeVisible()
  act(() => useUIStore.getState().exitFocusMode())
  expect(screen.getByLabelText('Day draft')).toHaveValue('A small intention')
  expect(screen.getByTestId('compact-focus-timer')).toHaveTextContent('20:30 Paused')
})
it('opens the same server-backed session from the compact timer', async () => {
  render(
    <AppShell>
      <p>Today</p>
    </AppShell>
  )
  await userEvent.click(screen.getByRole('button', { name: 'Open focus session' }))
  expect(useUIStore.getState().focusTaskId).toBe('task-1')
})

it('reopens a lost-response result in its original task context', async () => {
  focus.active = null
  focus.pending = { method: 'PATCH' }
  render(
    <AppShell>
      <p>Today</p>
    </AppShell>
  )
  await userEvent.click(screen.getByRole('button', { name: 'Open focus session' }))
  expect(useUIStore.getState().focusTaskId).toBe('task-1')
})
