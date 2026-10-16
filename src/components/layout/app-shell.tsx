'use client'

import { Sidebar } from './sidebar'
import { TopBar } from './top-bar'
import { BottomNav } from './bottom-nav'
import { AppBackground } from './app-background'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'
import { CommandLayer } from '@/components/command-palette/command-layer'
import { Toast } from '@/components/ui/toast'
import { FocusModeView } from '@/components/focus/focus-mode-view'
import { TimezoneSync } from '@/components/timezone-sync'
import { useEffect } from 'react'
import { useFocusStore } from '@/stores/focus-store'

/** Loads localStorage-backed UI and timer state after mount, keeping SSR and client HTML identical. */
function useHydrateClientState() {
  const hydrateUI = useUIStore((s) => s.hydrate)
  const hydrateFocus = useFocusStore((s) => s.hydrate)
  useEffect(() => {
    hydrateUI()
    hydrateFocus()
  }, [hydrateUI, hydrateFocus])
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, focusMode } = useUIStore()
  useHydrateClientState()

  if (focusMode) {
    return (
      <>
        <AppBackground />
        <FocusModeView />
        <Toast />
      </>
    )
  }

  return (
    <div className="relative flex h-[100dvh] overflow-hidden bg-background">
      <AppBackground />
      <Sidebar />
      <div
        className={cn(
          'relative z-10 flex flex-1 flex-col overflow-hidden transition-[margin] duration-300 ease-smooth',
          'ml-0 lg:ml-64',
          sidebarCollapsed && 'lg:ml-16'
        )}
      >
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 pb-28 md:p-6 lg:pb-6">{children}</main>
      </div>
      <BottomNav />
      <CommandLayer />
      <TimezoneSync />
      <Toast />
    </div>
  )
}
