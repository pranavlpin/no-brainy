'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, CheckSquare, Library, Menu } from 'lucide-react'
import { Sidebar } from './sidebar'
import { TopBar } from './top-bar'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'
import { QuickCaptureProvider } from '@/components/quick-capture/quick-capture-provider'
import { Toast } from '@/components/ui/toast'
import { FocusModeView } from '@/components/focus/focus-mode-view'
import { CompactFocusTimer } from '@/components/focus/compact-focus-timer'
import { FocusProvider } from '@/hooks/use-focus'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <FocusProvider>
      <WorkspaceShell>{children}</WorkspaceShell>
    </FocusProvider>
  )
}

function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, focusMode, setMobileSidebarOpen } = useUIStore()
  const pathname = usePathname()
  return (
    <div
      data-testid="app-shell"
      className="workspace-canvas flex h-dvh min-h-0 overflow-hidden text-foreground"
    >
      <div hidden={focusMode} style={{ display: focusMode ? 'none' : 'contents' }}>
        <a
          href="#workspace-main"
          className="sr-only z-[80] rounded-lg bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          Skip to content
        </a>
        <Sidebar />
        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-200 lg:ml-64',
            sidebarCollapsed && 'lg:ml-20'
          )}
        >
          <TopBar />
          <main
            id="workspace-main"
            tabIndex={-1}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-24 pt-7 outline-none sm:px-7 lg:px-10 lg:pb-10"
          >
            <div
              key={pathname}
              data-testid="page-content"
              className="motion-page mx-auto w-full max-w-[1400px]"
            >
              {children}
            </div>
          </main>
          <nav
            aria-label="Quick navigation"
            className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
          >
            {[
              { href: '/today', label: 'Today', icon: CalendarDays },
              { href: '/tasks', label: 'Tasks', icon: CheckSquare },
              { href: '/library', label: 'Library', icon: Library },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 py-3 text-[10px] font-medium',
                  pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex flex-col items-center gap-1 py-3 text-[10px] font-medium text-muted-foreground"
              aria-label="More destinations"
            >
              <Menu className="h-5 w-5" />
              More
            </button>
          </nav>
        </div>
      </div>
      {focusMode && <FocusModeView />}
      <CompactFocusTimer />
      <QuickCaptureProvider />
      <Toast />
    </div>
  )
}
