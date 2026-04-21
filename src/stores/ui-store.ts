import { create } from 'zustand'

// Default sidebar nav order
export const DEFAULT_NAV_ORDER = [
  '/notes', '/tasks', '/planner', '/expenses', '/reviews',
  '/books', '/watchlist', '/bookmarks', '/goals',
  '/search', '/analytics', '/insights', '/ai',
]

function loadNavOrder(): string[] {
  if (typeof window === 'undefined') return DEFAULT_NAV_ORDER
  try {
    const stored = localStorage.getItem('nobrainy-nav-order')
    if (stored) {
      const parsed = JSON.parse(stored) as string[]
      // Merge: keep stored order but add any new items not in stored
      const storedSet = new Set(parsed)
      const missing = DEFAULT_NAV_ORDER.filter((href) => !storedSet.has(href))
      return [...parsed, ...missing]
    }
  } catch { /* ignore */ }
  return DEFAULT_NAV_ORDER
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
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  mobileSidebarOpen: false,
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  focusMode: false,
  focusTaskId: null,
  enterFocusMode: (taskId) => set({ focusMode: true, focusTaskId: taskId }),
  exitFocusMode: () => set({ focusMode: false, focusTaskId: null }),
  navOrder: loadNavOrder(),
  setNavOrder: (order) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nobrainy-nav-order', JSON.stringify(order))
    }
    set({ navOrder: order })
  },
  resetNavOrder: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nobrainy-nav-order')
    }
    set({ navOrder: DEFAULT_NAV_ORDER })
  },
}))
