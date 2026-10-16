'use client'

import { Menu, Sun, Moon, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useUIStore, type WorkspaceContext } from '@/stores/ui-store'
import { useDarkModeStore } from '@/stores/dark-mode-store'
import { Breadcrumbs } from './breadcrumbs'
import { UserMenu } from './user-menu'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { Button } from '@/components/ui/button'

export function TopBar() {
  const { setMobileSidebarOpen, context, setContext } = useUIStore()
  const { isDark, toggle } = useDarkModeStore()
  return (
    <header className="relative z-20 flex h-[72px] shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-background/75 px-3 backdrop-blur-xl sm:px-6 lg:px-9">
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          onClick={() => setMobileSidebarOpen(true)}
          className="shrink-0 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden min-w-0 sm:block">
          <Breadcrumbs />
        </div>
        <select
          aria-label="Workspace context"
          value={context}
          onChange={(event) => setContext(event.target.value as WorkspaceContext)}
          className="max-w-[110px] rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground focus:outline-primary"
        >
          <option value="all">All of life</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
        </select>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Link
          href="/search"
          aria-label="Search workspace"
          className="hidden rounded-xl p-2.5 text-muted-foreground hover:bg-muted sm:block"
        >
          <Search className="h-4 w-4" />
        </Link>
        <Button
          size="sm"
          onClick={() => window.dispatchEvent(new Event('nobrainy:capture'))}
          aria-label="Capture"
          data-testid="capture-trigger"
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Capture<span className="ml-2 hidden text-[10px] opacity-60 xl:inline">⌘ K</span>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={toggle}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="h-9 w-9"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <div className="hidden md:block">
          <NotificationBell />
        </div>
        <UserMenu />
      </div>
    </header>
  )
}
