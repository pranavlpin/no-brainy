import { create } from 'zustand'

type DarkModePreference = 'light' | 'dark' | 'system'

interface DarkModeState {
  preference: DarkModePreference
  isDark: boolean
  /** True once the persisted preference has been loaded on the client. */
  hydrated: boolean
  /** Load the saved preference after mount; the first render stays server-identical. */
  hydrate: () => void
  setPreference: (pref: DarkModePreference) => void
  toggle: () => void
}

const STORAGE_KEY = 'nobrainy-dark-mode'

function loadPreference(): DarkModePreference {
  if (typeof window === 'undefined') return 'system'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    /* storage unavailable */
  }
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

function persist(pref: DarkModePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, pref)
  } catch {
    /* storage unavailable */
  }
}

let listening = false

/**
 * Dark-mode preference. The initial state matches what the server rendered
 * (light, system preference) so hydration never sees a different tree; the
 * saved choice is applied by `hydrate()` after mount.
 */
export const useDarkModeStore = create<DarkModeState>((set, get) => ({
  preference: 'system',
  isDark: false,
  hydrated: false,
  hydrate: () => {
    const preference = loadPreference()
    const isDark = getIsDark(preference)
    applyColorModeClass(isDark)
    set({ preference, isDark, hydrated: true })
    if (!listening && typeof window !== 'undefined') {
      listening = true
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (get().preference === 'system') {
          applyColorModeClass(e.matches)
          set({ isDark: e.matches })
        }
      })
    }
  },
  setPreference: (pref: DarkModePreference) => {
    persist(pref)
    const isDark = getIsDark(pref)
    applyColorModeClass(isDark)
    set({ preference: pref, isDark })
  },
  toggle: () => {
    const { isDark } = get()
    const pref: DarkModePreference = isDark ? 'light' : 'dark'
    persist(pref)
    applyColorModeClass(!isDark)
    set({ preference: pref, isDark: !isDark })
  },
}))
