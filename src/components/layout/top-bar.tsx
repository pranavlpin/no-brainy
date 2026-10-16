'use client'

import { Menu, Sun, Moon, Search } from 'lucide-react'
import { useCommandStore } from '@/stores/command-store'
import { useUIStore } from '@/stores/ui-store'
import { useDarkModeStore } from '@/stores/dark-mode-store'
import { Breadcrumbs } from './breadcrumbs'
import { UserMenu } from './user-menu'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { FocusPill } from './focus-pill'
import { ContextSwitch } from './context-switch'

export function TopBar() {
  const { setMobileSidebarOpen } = useUIStore()
  const { isDark, toggle } = useDarkModeStore()
  const setPalette = useCommandStore((s) => s.setPalette)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="text-muted-foreground hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Breadcrumbs />
      </div>
      <div className="flex items-center gap-2">
        <FocusPill />
        <ContextSwitch className="hidden md:flex" />
        <button
          type="button"
          onClick={() => setPalette(true)}
          data-testid="topbar-palette"
          className="hidden items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-retro-blue/40 hover:text-foreground sm:flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search or jump…</span>
          <kbd className="rounded border border-retro-dark/15 px-1 font-mono text-[10px]">⌘K</kbd>
        </button>
        <button
          onClick={toggle}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  )
}
