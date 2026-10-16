import { create } from 'zustand'

export const DEFAULT_NAV_ORDER = [
  '/today',
  '/inbox',
  '/planner',
  '/tasks',
  '/projects',
  '/goals',
  '/library',
  '/reviews',
  '/notes',
  '/stash',
  '/books',
  '/flashcards',
  '/expenses',
  '/budgets',
  '/watchlist',
  '/bookmarks',
  '/search',
  '/analytics',
  '/insights',
  '/ai',
]
export type WorkspaceContext = 'all' | 'work' | 'personal'

function readList(key: string): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (item): item is string => typeof item === 'string' && DEFAULT_NAV_ORDER.includes(item)
            )
          ),
        ]
      : []
  } catch {
    return []
  }
}
function persist(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* UI preferences remain usable in memory. */
  }
}
function orderWithDefaults(order: string[]) {
  return [
    ...new Set([...order.filter((href) => DEFAULT_NAV_ORDER.includes(href)), ...DEFAULT_NAV_ORDER]),
  ]
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
  navOrder: string[]
  setNavOrder: (order: string[]) => void
  resetNavOrder: () => void
  hiddenNavItems: string[]
  setHiddenNavItems: (items: string[]) => void
  toggleNavItem: (href: string) => void
  context: WorkspaceContext
  setContext: (context: WorkspaceContext) => void
  hydratePreferences: () => void
}

/** UI preferences hydrate after SSR and migrate legacy navigation without losing valid choices. */
export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((s) => {
      persist('nobrainy-sidebar-collapsed', String(!s.sidebarCollapsed))
      return { sidebarCollapsed: !s.sidebarCollapsed }
    }),
  setSidebarCollapsed: (sidebarCollapsed) => {
    persist('nobrainy-sidebar-collapsed', String(sidebarCollapsed))
    set({ sidebarCollapsed })
  },
  mobileSidebarOpen: false,
  setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
  focusMode: false,
  focusTaskId: null,
  enterFocusMode: (focusTaskId) => set({ focusMode: true, focusTaskId }),
  exitFocusMode: () => set({ focusMode: false, focusTaskId: null }),
  navOrder: DEFAULT_NAV_ORDER,
  hiddenNavItems: [],
  context: 'all',
  setContext: (context) => {
    persist('nobrainy-context', context)
    set({ context })
  },
  hydratePreferences: () => {
    const navOrder = orderWithDefaults(readList('nobrainy-nav-order'))
    const hiddenNavItems = readList('nobrainy-hidden-nav')
    let context: WorkspaceContext = 'all'
    let sidebarCollapsed = false
    try {
      const stored = localStorage.getItem('nobrainy-context')
      if (stored === 'work' || stored === 'personal') context = stored
      sidebarCollapsed = localStorage.getItem('nobrainy-sidebar-collapsed') === 'true'
    } catch {
      /* Keep recoverable defaults. */
    }
    persist('nobrainy-ui-version', '2')
    set({ navOrder, hiddenNavItems, context, sidebarCollapsed })
  },
  setNavOrder: (order) => {
    const navOrder = orderWithDefaults(order)
    persist('nobrainy-nav-order', JSON.stringify(navOrder))
    set({ navOrder })
  },
  resetNavOrder: () => {
    persist('nobrainy-nav-order', null)
    persist('nobrainy-hidden-nav', null)
    set({ navOrder: DEFAULT_NAV_ORDER, hiddenNavItems: [] })
  },
  setHiddenNavItems: (items) => {
    const hiddenNavItems = items.filter((item) => DEFAULT_NAV_ORDER.includes(item))
    persist('nobrainy-hidden-nav', JSON.stringify(hiddenNavItems))
    set({ hiddenNavItems })
  },
  toggleNavItem: (href) =>
    set((s) => {
      const hiddenNavItems = s.hiddenNavItems.includes(href)
        ? s.hiddenNavItems.filter((item) => item !== href)
        : [...s.hiddenNavItems, href]
      persist('nobrainy-hidden-nav', JSON.stringify(hiddenNavItems))
      return { hiddenNavItems }
    }),
}))
