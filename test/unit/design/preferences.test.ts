import { beforeEach, expect, it, vi } from 'vitest'

const values = new Map<string, string>()
beforeEach(() => {
  vi.resetModules()
  values.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  })
})

it('keeps reordered/hidden legacy destinations and restores missing Flashcards access', async () => {
  values.set('nobrainy-nav-order', JSON.stringify(['/books', '/notes', '/tasks']))
  values.set('nobrainy-hidden-nav', JSON.stringify(['/expenses']))
  const { useUIStore } = await import('@/stores/ui-store')
  useUIStore.getState().hydratePreferences()
  const state = useUIStore.getState()
  expect(state.navOrder.indexOf('/books')).toBeLessThan(state.navOrder.indexOf('/notes'))
  expect(state.navOrder).toContain('/flashcards')
  expect(state.hiddenNavItems).toContain('/expenses')
  expect(values.get('nobrainy-ui-version')).toBe('2')
})

it('recovers safely from malformed saved navigation preferences', async () => {
  values.set('nobrainy-hidden-nav', 'broken json')
  values.set('nobrainy-nav-order', '{"wrong":"shape"}')
  const { useUIStore } = await import('@/stores/ui-store')
  useUIStore.getState().hydratePreferences()
  expect(useUIStore.getState().navOrder).toContain('/tasks')
  expect(useUIStore.getState().hiddenNavItems).toEqual([])
})

it('preserves a saved custom palette and active theme on hydration', async () => {
  const custom = {
    id: 'my-ocean',
    name: 'My ocean',
    colors: { '--retro-blue': '210 70% 40%', '--sidebar-bg': '210 30% 12%' },
  }
  values.set('nobrainy-theme', 'custom')
  values.set('nobrainy-active-custom-theme', custom.id)
  values.set('nobrainy-custom-themes', JSON.stringify([custom]))
  const { useThemeStore } = await import('@/stores/theme-store')
  useThemeStore.getState().hydrate()
  expect(useThemeStore.getState().customThemes).toEqual([custom])
  expect(useThemeStore.getState().theme).toBe('custom')
  expect(document.documentElement.style.getPropertyValue('--retro-blue')).toBe('210 70% 40%')
  expect(values.get('nobrainy-custom-themes')).toBe(JSON.stringify([custom]))
})
