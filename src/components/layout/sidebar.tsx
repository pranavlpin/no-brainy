'use client'

import {
  FileText,
  CheckSquare,
  BookOpen,
  Layers,
  Calendar,
  BarChart3,
  Target,
  Search,
  TrendingUp,
  Sparkles,
  Lightbulb,
  Wallet,
  PiggyBank,
  Bookmark,
  Film,
  Archive,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import Link from 'next/link'
import { Dialog } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { SidebarNavItem, type NavItem } from './sidebar-nav'

const NAV_ITEMS_MAP: Record<string, NavItem> = {
  '/today': { label: 'Today', href: '/today', icon: Calendar },
  '/library': { label: 'Library', href: '/library', icon: BookOpen },
  '/notes': { label: 'Notes', href: '/notes', icon: FileText },
  '/stash': { label: 'Stash', href: '/stash', icon: Archive },
  '/tasks': { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  '/books': { label: 'Books', href: '/books', icon: BookOpen },
  '/flashcards': { label: 'Flashcards', href: '/flashcards', icon: Layers },
  '/planner': { label: 'Daily Planner', href: '/planner', icon: Calendar },
  '/reviews': { label: 'Nightly Reviews', href: '/reviews', icon: BarChart3 },
  '/goals': { label: 'Growth', href: '/goals', icon: Target },
  '/search': { label: 'Search', href: '/search', icon: Search },
  '/analytics': { label: 'Analytics', href: '/analytics', icon: TrendingUp },
  '/expenses': { label: 'Expenses', href: '/expenses', icon: Wallet },
  '/budgets': { label: 'Budgets', href: '/budgets', icon: PiggyBank },
  '/bookmarks': { label: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
  '/watchlist': { label: 'Watchlist', href: '/watchlist', icon: Film },
  '/insights': { label: 'Insights', href: '/insights', icon: Lightbulb },
  '/ai': { label: 'AI Coach', href: '/ai', icon: Sparkles },
}

const NAV_GROUPS: Record<string, string> = {
  '/notes': 'core',
  '/stash': 'core',
  '/tasks': 'core',
  '/planner': 'core',
  '/reviews': 'core',
  '/expenses': 'finance',
  '/budgets': 'finance',
  '/books': 'learning',
  '/flashcards': 'learning',
  '/goals': 'goals',
  '/search': 'tools',
  '/analytics': 'tools',
  '/insights': 'tools',
  '/ai': 'tools',
  '/bookmarks': 'media',
  '/watchlist': 'media',
}

export { NAV_ITEMS_MAP, NAV_GROUPS }

export const PRIMARY_NAV = ['/today', '/tasks', '/goals', '/library']

export function Sidebar() {
  const {
    sidebarCollapsed,
    toggleSidebar,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    navOrder,
    hiddenNavItems,
  } = useUIStore()
  const content = (mobile = false) => (
    <>
      <div className="flex h-20 shrink-0 items-center justify-between px-5">
        <Link
          href="/today"
          aria-label="NoBrainy home"
          className="flex items-center gap-2.5 text-sidebar-fg"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          {(!sidebarCollapsed || mobile) && (
            <span className="font-display text-lg font-semibold tracking-tight">
              NoBrainy<span className="text-primary">.</span>
            </span>
          )}
        </Link>
        {!mobile && !sidebarCollapsed && (
          <button
            aria-label="Collapse navigation"
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 text-sidebar-fg/50 hover:bg-sidebar-fg/10"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>
      {sidebarCollapsed && !mobile && (
        <button
          aria-label="Expand navigation"
          onClick={toggleSidebar}
          className="mx-auto mb-3 p-2 text-sidebar-fg/60"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}
      <nav
        aria-label={mobile ? 'Mobile navigation' : 'Primary navigation'}
        data-testid="primary-navigation"
        className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-6"
      >
        {(!sidebarCollapsed || mobile) && (
          <p className="px-3 pb-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-fg/45">
            Your workspace
          </p>
        )}
        {PRIMARY_NAV.filter((href) => !hiddenNavItems.includes(href)).map((href) => (
          <SidebarNavItem key={href} item={NAV_ITEMS_MAP[href]} expanded={mobile} />
        ))}
        <div className="mx-3 my-5 border-t border-sidebar-fg/10" />
        {(!sidebarCollapsed || mobile) && (
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-fg/45">
            Explore & reflect
          </p>
        )}
        {navOrder
          .filter(
            (href) =>
              !PRIMARY_NAV.includes(href) && !hiddenNavItems.includes(href) && NAV_ITEMS_MAP[href]
          )
          .map((href) => (
            <SidebarNavItem key={href} item={NAV_ITEMS_MAP[href]} expanded={mobile} />
          ))}
      </nav>
      {(!sidebarCollapsed || mobile) && (
        <div className="m-4 rounded-2xl border border-sidebar-fg/10 bg-sidebar-fg/[0.03] p-4 text-sidebar-fg">
          <p className="text-xs font-medium">A little progress, every day.</p>
          <p className="mt-1 text-[11px] leading-relaxed text-sidebar-fg/55">
            Make room for what matters.
          </p>
        </div>
      )}
    </>
  )
  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border/60 bg-sidebar-bg transition-[width] duration-200 lg:flex',
          sidebarCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {content()}
      </aside>
      <Dialog
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        title="Your workspace"
        className="max-w-sm"
      >
        <div className="flex max-h-[70dvh] flex-col rounded-2xl bg-sidebar-bg">{content(true)}</div>
      </Dialog>
    </>
  )
}
