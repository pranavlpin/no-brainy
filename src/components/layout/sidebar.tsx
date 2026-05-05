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
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { SidebarNavItem, type NavItem } from './sidebar-nav'

const NAV_ITEMS_MAP: Record<string, NavItem> = {
  '/notes': { label: 'Notes', href: '/notes', icon: FileText },
  '/tasks': { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  '/books': { label: 'Books', href: '/books', icon: BookOpen },
  '/flashcards': { label: 'Flashcards', href: '/flashcards', icon: Layers },
  '/planner': { label: 'Daily Planner', href: '/planner', icon: Calendar },
  '/reviews': { label: 'Nightly Reviews', href: '/reviews', icon: BarChart3 },
  '/goals': { label: 'Goals', href: '/goals', icon: Target },
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

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen, navOrder, hiddenNavItems } =
    useUIStore()

  const navItems = navOrder
    .filter((href) => !hiddenNavItems.includes(href))
    .map((href) => NAV_ITEMS_MAP[href])
    .filter(Boolean) as NavItem[]

  return (
    <>
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64',
          // Mobile: hidden by default, shown when open
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
          {!sidebarCollapsed && (
            <span className="text-lg font-bold text-white">NoBrainy</span>
          )}
          {/* Mobile close button */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="text-slate-400 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
          {/* Desktop collapse toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden text-slate-400 hover:text-white lg:block"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {navItems.map((item, index) => {
            const prevItem = index > 0 ? navItems[index - 1] : null
            const currentGroup = NAV_GROUPS[item.href] ?? ''
            const prevGroup = prevItem ? (NAV_GROUPS[prevItem.href] ?? '') : currentGroup
            const showDivider = index > 0 && currentGroup !== prevGroup

            return (
              <div key={item.href}>
                {showDivider && (
                  <div className="my-1 border-t border-slate-700/50" />
                )}
                <SidebarNavItem item={item} />
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
