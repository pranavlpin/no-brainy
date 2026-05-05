import { create } from 'zustand'

type DarkModePreference = 'light' | 'dark' | 'system'

interface DarkModeState {
  preference: DarkModePreference
  isDark: boolean
  setPreference: (pref: DarkModePreference) => void
  toggle: () => void
}

function loadPreference(): DarkModePreference {
  if (typeof window === 'undefined') return 'system'
  const stored = localStorage.getItem('nobrainy-dark-mode')
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

function getIsDark(pref: DarkModePreference): boolean {
  if (pref === 'dark') return true
  if (pref === 'light') return false
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyDarkClass(isDark: boolean): void {
  if (typeof document === 'undefined') return
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export const useDarkModeStore = create<DarkModeState>((set, get) => {
  const preference = loadPreference()
  const isDark = getIsDark(preference)

  if (typeof window !== 'undefined') {
    applyDarkClass(isDark)

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const { preference } = get()
      if (preference === 'system') {
        const newIsDark = e.matches
        applyDarkClass(newIsDark)
        set({ isDark: newIsDark })
      }
    })
  }

  return {
    preference,
    isDark,
    setPreference: (pref: DarkModePreference) => {
      localStorage.setItem('nobrainy-dark-mode', pref)
      const newIsDark = getIsDark(pref)
      applyDarkClass(newIsDark)
      set({ preference: pref, isDark: newIsDark })
    },
    toggle: () => {
      const { isDark } = get()
      const newPref: DarkModePreference = isDark ? 'light' : 'dark'
      localStorage.setItem('nobrainy-dark-mode', newPref)
      applyDarkClass(!isDark)
      set({ preference: newPref, isDark: !isDark })
    },
  }
})
