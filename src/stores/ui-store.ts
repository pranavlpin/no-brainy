import { create } from 'zustand'
import type { NavGroupKey } from '@/lib/nav/items'

const HIDDEN_KEY = 'nobrainy-hidden-nav'
const COLLAPSED_KEY = 'nobrainy-collapsed-groups'

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void
  focusMode: boolean
  focusTaskId: string | null
  enterFocusMode: (taskId: string) => void
  exitFocusMode: () => void
  /** Nav hrefs the user chose to hide from the sidebar. */
  hiddenNavItems: string[]
  toggleNavItem: (href: string) => void
  /** Sidebar groups the user folded away. */
  collapsedGroups: NavGroupKey[]
  toggleGroup: (key: NavGroupKey) => void
  /** Show every item and expand every group. */
  resetNav: () => void
  /** True once persisted values have been loaded on the client. */
  hydrated: boolean
  /**
   * Load persisted values from localStorage. Called after mount so the first
   * client render matches the server HTML (no hydration mismatch).
   */
  hydrate: () => void
  /** Test helper: back to server defaults. */
  resetForTests: () => void
}

const SERVER_DEFAULTS = {
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  focusMode: false,
  focusTaskId: null as string | null,
  hiddenNavItems: [] as string[],
  collapsedGroups: [] as NavGroupKey[],
  hydrated: false,
}

export const useUIStore = create<UIState>((set) => ({
  ...SERVER_DEFAULTS,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  enterFocusMode: (taskId) => set({ focusMode: true, focusTaskId: taskId }),
  exitFocusMode: () => set({ focusMode: false, focusTaskId: null }),
  toggleNavItem: (href) =>
    set((s) => {
      const hidden = s.hiddenNavItems.includes(href)
        ? s.hiddenNavItems.filter((h) => h !== href)
        : [...s.hiddenNavItems, href]
      writeJson(HIDDEN_KEY, hidden)
      return { hiddenNavItems: hidden }
    }),
  toggleGroup: (key) =>
    set((s) => {
      const collapsed = s.collapsedGroups.includes(key)
        ? s.collapsedGroups.filter((k) => k !== key)
        : [...s.collapsedGroups, key]
      writeJson(COLLAPSED_KEY, collapsed)
      return { collapsedGroups: collapsed }
    }),
  resetNav: () => {
    writeJson(HIDDEN_KEY, [])
    writeJson(COLLAPSED_KEY, [])
    if (typeof window !== 'undefined') localStorage.removeItem('nobrainy-nav-order')
    set({ hiddenNavItems: [], collapsedGroups: [] })
  },
  hydrate: () =>
    set({
      hiddenNavItems: readJson<string[]>(HIDDEN_KEY, []),
      collapsedGroups: readJson<NavGroupKey[]>(COLLAPSED_KEY, []),
      hydrated: true,
    }),
  resetForTests: () => set({ ...SERVER_DEFAULTS }),
}))
