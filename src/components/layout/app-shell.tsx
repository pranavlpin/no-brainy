'use client'

import { Sidebar } from './sidebar'
import { TopBar } from './top-bar'
import { AppBackground } from './app-background'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'
import { QuickCaptureProvider } from '@/components/quick-capture/quick-capture-provider'
import { Toast } from '@/components/ui/toast'
import { FocusModeView } from '@/components/focus/focus-mode-view'
import { TimezoneSync } from '@/components/timezone-sync'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, focusMode } = useUIStore()

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
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
      <QuickCaptureProvider />
      <TimezoneSync />
      <Toast />
    </div>
  )
}
