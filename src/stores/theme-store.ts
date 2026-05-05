import { create } from 'zustand'

export const THEMES = ['retro', 'ocean', 'forest', 'sunset'] as const
export type ThemeName = (typeof THEMES)[number]

export interface CustomTheme {
  id: string
  name: string
  colors: Record<string, string>
}

interface ThemeState {
  theme: ThemeName | 'custom'
  customThemes: CustomTheme[]
  activeCustomThemeId: string | null
  setTheme: (theme: ThemeName) => void
  applyCustomTheme: (id: string) => void
  saveCustomTheme: (theme: Omit<CustomTheme, 'id'>) => CustomTheme
  updateCustomTheme: (id: string, updates: Partial<Omit<CustomTheme, 'id'>>) => void
  deleteCustomTheme: (id: string) => void
  applyLiveColors: (colors: Record<string, string>) => void
}

const CUSTOM_THEMES_KEY = 'nobrainy-custom-themes'
const ACTIVE_CUSTOM_THEME_KEY = 'nobrainy-active-custom-theme'

function loadCustomThemes(): CustomTheme[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(CUSTOM_THEMES_KEY)
    return stored ? JSON.parse(stored) as CustomTheme[] : []
  } catch {
    return []
  }
}

function saveCustomThemesToStorage(themes: CustomTheme[]): void {
  localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes))
}

function loadActiveCustomThemeId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACTIVE_CUSTOM_THEME_KEY)
}

function loadTheme(): ThemeName | 'custom' {
  if (typeof window === 'undefined') return 'retro'
  const stored = localStorage.getItem('nobrainy-theme')
  if (stored === 'custom') return 'custom'
  if (stored && THEMES.includes(stored as ThemeName)) return stored as ThemeName
  return 'retro'
}

function clearCustomCssVars(): void {
  if (typeof document === 'undefined') return
  const style = document.documentElement.style
  const varsToRemove = [
    '--retro-blue',
    '--retro-pink',
    '--retro-yellow',
    '--retro-mint',
    '--retro-orange',
    '--retro-dark',
    '--retro-cream',
    '--sidebar-bg',
    '--sidebar-fg',
    '--page-bg-subtle',
  ]
  varsToRemove.forEach((v) => style.removeProperty(v))
}

function applyPresetTheme(theme: ThemeName): void {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  THEMES.forEach((t) => html.classList.remove(`theme-${t}`))
  clearCustomCssVars()
  if (theme !== 'retro') {
    html.classList.add(`theme-${theme}`)
  }
}

function applyCssVars(colors: Record<string, string>): void {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  THEMES.forEach((t) => html.classList.remove(`theme-${t}`))
  Object.entries(colors).forEach(([key, value]) => {
    html.style.setProperty(key, value)
  })
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = loadTheme()
  const customThemes = loadCustomThemes()
  const activeCustomThemeId = loadActiveCustomThemeId()

  if (typeof window !== 'undefined') {
    if (initial === 'custom') {
      const active = customThemes.find((c) => c.id === activeCustomThemeId)
      if (active) {
        applyCssVars(active.colors)
      } else {
        applyPresetTheme('retro')
      }
    } else {
      applyPresetTheme(initial)
    }
  }

  return {
    theme: initial,
    customThemes,
    activeCustomThemeId,

    setTheme: (theme: ThemeName) => {
      localStorage.setItem('nobrainy-theme', theme)
      localStorage.removeItem(ACTIVE_CUSTOM_THEME_KEY)
      clearCustomCssVars()
      applyPresetTheme(theme)
      set({ theme, activeCustomThemeId: null })
    },

    applyCustomTheme: (id: string) => {
      const { customThemes } = get()
      const found = customThemes.find((c) => c.id === id)
      if (!found) return
      localStorage.setItem('nobrainy-theme', 'custom')
      localStorage.setItem(ACTIVE_CUSTOM_THEME_KEY, id)
      applyCssVars(found.colors)
      set({ theme: 'custom', activeCustomThemeId: id })
    },

    saveCustomTheme: (themeData: Omit<CustomTheme, 'id'>) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
      const newTheme: CustomTheme = { id, ...themeData }
      const { customThemes } = get()
      const updated = [...customThemes, newTheme]
      saveCustomThemesToStorage(updated)
      set({ customThemes: updated })
      return newTheme
    },

    updateCustomTheme: (id: string, updates: Partial<Omit<CustomTheme, 'id'>>) => {
      const { customThemes } = get()
      const updated = customThemes.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      )
      saveCustomThemesToStorage(updated)
      set({ customThemes: updated })
    },

    deleteCustomTheme: (id: string) => {
      const { customThemes, activeCustomThemeId } = get()
      const updated = customThemes.filter((c) => c.id !== id)
      saveCustomThemesToStorage(updated)
      if (activeCustomThemeId === id) {
        localStorage.removeItem(ACTIVE_CUSTOM_THEME_KEY)
        localStorage.setItem('nobrainy-theme', 'retro')
        clearCustomCssVars()
        applyPresetTheme('retro')
        set({ customThemes: updated, theme: 'retro', activeCustomThemeId: null })
      } else {
        set({ customThemes: updated })
      }
    },

    applyLiveColors: (colors: Record<string, string>) => {
      applyCssVars(colors)
    },
  }
})
