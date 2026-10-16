import { beforeEach, describe, expect, it } from 'vitest'

describe('persisted client stores hydrate after mount, not at import', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('nobrainy-collapsed-groups', JSON.stringify(['learn']))
    localStorage.setItem('nobrainy-hidden-nav', JSON.stringify(['/watchlist']))
    localStorage.setItem(
      'nobrainy-focus-timer',
      JSON.stringify({
        phase: 'running',
        kind: 'work',
        startedAt: Date.now(),
        plannedSec: 1500,
        pomodoroCount: 2,
      })
    )
  })

  it('ui store starts from server defaults and loads persisted values on hydrate()', async () => {
    const { useUIStore } = await import('@/stores/ui-store')
    useUIStore.getState().resetForTests?.()
    expect(useUIStore.getState().collapsedGroups).toEqual([])
    expect(useUIStore.getState().hiddenNavItems).toEqual([])
    useUIStore.getState().hydrate()
    expect(useUIStore.getState().collapsedGroups).toEqual(['learn'])
    expect(useUIStore.getState().hiddenNavItems).toEqual(['/watchlist'])
  })

  it('focus store starts idle and loads the running timer on hydrate()', async () => {
    const { useFocusStore } = await import('@/stores/focus-store')
    useFocusStore.getState().reset()
    localStorage.setItem(
      'nobrainy-focus-timer',
      JSON.stringify({
        phase: 'running',
        kind: 'work',
        startedAt: Date.now(),
        plannedSec: 1500,
        pomodoroCount: 2,
      })
    )
    expect(useFocusStore.getState().phase).toBe('idle')
    useFocusStore.getState().hydrate()
    expect(useFocusStore.getState().phase).toBe('running')
    expect(useFocusStore.getState().pomodoroCount).toBe(2)
  })
})
