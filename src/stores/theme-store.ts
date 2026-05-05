import { create } from 'zustand'

export const THEMES = ['retro', 'ocean', 'forest', 'sunset'] as const
export type ThemeName = (typeof THEMES)[number]

interface ThemeState {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
}

function loadTheme(): ThemeName {
  if (typeof window === 'undefined') return 'retro'
  const stored = localStorage.getItem('nobrainy-theme')
  if (stored && THEMES.includes(stored as ThemeName)) return stored as ThemeName
  return 'retro'
}

function applyTheme(theme: ThemeName): void {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  THEMES.forEach((t) => html.classList.remove(`theme-${t}`))
  if (theme !== 'retro') {
    html.classList.add(`theme-${theme}`)
  }
}

export const useThemeStore = create<ThemeState>((set) => {
  const initial = loadTheme()
  if (typeof window !== 'undefined') {
    applyTheme(initial)
  }
  return {
    theme: initial,
    setTheme: (theme) => {
      localStorage.setItem('nobrainy-theme', theme)
      applyTheme(theme)
      set({ theme })
    },
  }
})
