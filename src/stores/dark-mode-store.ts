import { create } from 'zustand'

type DarkModePreference = 'light' | 'dark' | 'system'

interface DarkModeState {
  hydrate: () => void
  preference: DarkModePreference
  isDark: boolean
  setPreference: (pref: DarkModePreference) => void
  toggle: () => void
}

function loadPreference(): DarkModePreference {
  if (typeof window === 'undefined') return 'system'
  let stored: string | null = null
  try {
    stored = localStorage.getItem('nobrainy-dark-mode')
  } catch {
    return 'system'
  }
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

function getIsDark(pref: DarkModePreference): boolean {
  if (pref === 'dark') return true
  if (pref === 'light') return false
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyColorModeClass(isDark: boolean): void {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  if (isDark) {
    html.classList.add('dark')
    html.classList.remove('light')
  } else {
    html.classList.add('light')
    html.classList.remove('dark')
  }
}

export const useDarkModeStore = create<DarkModeState>((set, get) => {
  let listening = false
  return {
    preference: 'system',
    isDark: false,
    hydrate: () => {
      const preference = loadPreference()
      const isDark = getIsDark(preference)
      applyColorModeClass(isDark)
      set({ preference, isDark })
      if (!listening) {
        listening = true
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
          if (get().preference === 'system') {
            applyColorModeClass(event.matches)
            set({ isDark: event.matches })
          }
        })
      }
    },
    setPreference: (pref: DarkModePreference) => {
      try {
        localStorage.setItem('nobrainy-dark-mode', pref)
      } catch {
        /* Keep the chosen appearance in memory. */
      }
      const newIsDark = getIsDark(pref)
      applyColorModeClass(newIsDark)
      set({ preference: pref, isDark: newIsDark })
    },
    toggle: () => {
      const { isDark } = get()
      const newPref: DarkModePreference = isDark ? 'light' : 'dark'
      try {
        localStorage.setItem('nobrainy-dark-mode', newPref)
      } catch {
        /* Keep the chosen appearance in memory. */
      }
      applyColorModeClass(!isDark)
      set({ preference: newPref, isDark: !isDark })
    },
  }
})
