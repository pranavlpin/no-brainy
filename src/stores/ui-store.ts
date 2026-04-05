import { create } from 'zustand'

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
}))
