import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('dark mode store hydration', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('starts from the server default even when dark is stored, and hydrate() applies it', async () => {
    localStorage.setItem('nobrainy-dark-mode', 'dark')
    const { useDarkModeStore } = await import('@/stores/dark-mode-store')
    expect(useDarkModeStore.getState().preference).toBe('system')
    expect(useDarkModeStore.getState().isDark).toBe(false)
    useDarkModeStore.getState().hydrate()
    expect(useDarkModeStore.getState().preference).toBe('dark')
    expect(useDarkModeStore.getState().isDark).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('applies the saved mode before paint from the root layout', () => {
    const layout = fs.readFileSync(path.join(process.cwd(), 'src/app/layout.tsx'), 'utf8')
    expect(layout).toMatch(/nobrainy-dark-mode/)
  })
})
