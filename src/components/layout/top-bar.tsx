'use client'

import { Menu, Sun, Moon } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useDarkModeStore } from '@/stores/dark-mode-store'
import { Breadcrumbs } from './breadcrumbs'
import { UserMenu } from './user-menu'
import { NotificationBell } from '@/components/notifications/notification-bell'

export function TopBar() {
  const { setMobileSidebarOpen } = useUIStore()
  const { isDark, toggle } = useDarkModeStore()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4 lg:px-6">
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
