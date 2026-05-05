import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('theme-store', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.resetModules()
    document.documentElement.className = ''
  })

  it('should default to retro theme', async () => {
    const { useThemeStore } = await import('./theme-store')
    const state = useThemeStore.getState()
    expect(state.theme).toBe('retro')
  })

  it('should load theme from localStorage', async () => {
    localStorageMock.setItem('nobrainy-theme', 'ocean')
    const { useThemeStore } = await import('./theme-store')
    const state = useThemeStore.getState()
    expect(state.theme).toBe('ocean')
  })

  it('should apply theme class to document', async () => {
    const { useThemeStore } = await import('./theme-store')
    useThemeStore.getState().setTheme('forest')
    expect(document.documentElement.classList.contains('theme-forest')).toBe(true)
  })

  it('should remove old theme class when switching', async () => {
    const { useThemeStore } = await import('./theme-store')
    useThemeStore.getState().setTheme('ocean')
    useThemeStore.getState().setTheme('sunset')
    expect(document.documentElement.classList.contains('theme-ocean')).toBe(false)
    expect(document.documentElement.classList.contains('theme-sunset')).toBe(true)
  })

  it('should not add class for retro theme', async () => {
    const { useThemeStore } = await import('./theme-store')
    useThemeStore.getState().setTheme('ocean')
    useThemeStore.getState().setTheme('retro')
    expect(document.documentElement.classList.contains('theme-retro')).toBe(false)
    expect(document.documentElement.classList.contains('theme-ocean')).toBe(false)
  })

  it('should persist theme to localStorage', async () => {
    const { useThemeStore } = await import('./theme-store')
    useThemeStore.getState().setTheme('sunset')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('nobrainy-theme', 'sunset')
  })

  it('should fallback to retro for invalid stored value', async () => {
    localStorageMock.setItem('nobrainy-theme', 'invalid-theme')
    const { useThemeStore } = await import('./theme-store')
    expect(useThemeStore.getState().theme).toBe('retro')
  })
})
