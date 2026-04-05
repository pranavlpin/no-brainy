'use client'

import { Sidebar } from './sidebar'
import { TopBar } from './top-bar'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'
import { QuickCaptureProvider } from '@/components/quick-capture/quick-capture-provider'
import { Toast } from '@/components/ui/toast'
import { FocusModeView } from '@/components/focus/focus-mode-view'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, focusMode } = useUIStore()

  if (focusMode) {
    return <FocusModeView />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div
        className={cn(
          'flex flex-1 flex-col overflow-hidden transition-all duration-300',
          'ml-0 lg:ml-64',
          sidebarCollapsed && 'lg:ml-16'
        )}
      >
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <QuickCaptureProvider />
      <Toast />
    </div>
  )
}
