'use client'

import { ChevronDown, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { NAV_GROUPS, NAV_ITEMS, type NavGroupKey } from '@/lib/nav/items'
import { useNavBadges } from '@/hooks/use-nav-badges'
import { SidebarNavItem } from './sidebar-nav'

const BADGE_FOR: Record<string, 'cardsDue' | 'overdueTasks' | 'unreadNotifications'> = {
  '/flashcards': 'cardsDue',
  '/tasks': 'overdueTasks',
}

export function Sidebar() {
  const {
    sidebarCollapsed,
    toggleSidebar,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    hiddenNavItems,
    collapsedGroups,
    toggleGroup,
  } = useUIStore()
  const { data: badges } = useNavBadges()

  const visibleItems = NAV_ITEMS.filter((item) => !hiddenNavItems.includes(item.href))
  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: visibleItems.filter((i) => i.group === g.key),
  })).filter((g) => g.items.length > 0)

  const badgeFor = (href: string): number | undefined => {
    const key = BADGE_FOR[href]
    return key && badges ? badges[key] : undefined
  }

  return (
    <>
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-retro-dark/50 backdrop-blur-sm animate-in fade-in duration-150 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        data-testid="sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10 bg-sidebar-bg/90 backdrop-blur-xl transition-all duration-300 ease-smooth',
          sidebarCollapsed ? 'w-16' : 'w-64',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          {!sidebarCollapsed && (
            <span className="font-display text-lg font-bold tracking-tight text-sidebar-fg">
              NoBrainy<span className="text-retro-pink">.</span>
            </span>
          )}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="text-sidebar-fg/60 hover:text-sidebar-fg lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            onClick={toggleSidebar}
            className="hidden text-sidebar-fg/60 hover:text-sidebar-fg lg:block"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Primary">
          {groups.map((group, index) => {
            const isToday = group.key === 'today'
            const collapsed = collapsedGroups.includes(group.key as NavGroupKey)
            return (
              <div key={group.key} className={cn(index > 0 && 'mt-2')}>
                {sidebarCollapsed
                  ? index > 0 && <div className="mx-2 my-2 border-t border-white/10" />
                  : !isToday && (
                      <button
                        type="button"
                        data-testid={`nav-group-${group.key}`}
                        aria-expanded={!collapsed}
                        aria-controls={`nav-group-items-${group.key}`}
                        onClick={() => toggleGroup(group.key as NavGroupKey)}
                        className="group/header flex w-full items-center justify-between rounded-md px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-fg/40 transition-colors hover:text-sidebar-fg/70"
                      >
                        {group.label}
                        <ChevronDown
                          className={cn(
                            'h-3 w-3 transition-transform duration-200 ease-smooth',
                            collapsed && '-rotate-90'
                          )}
                        />
                      </button>
                    )}
                <AnimatePresence initial={false}>
                  {(!collapsed || sidebarCollapsed) && (
                    <motion.div
                      id={`nav-group-items-${group.key}`}
                      key="items"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0.5">
                        {group.items.map((item) => (
                          <SidebarNavItem key={item.href} item={item} badge={badgeFor(item.href)} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </nav>

        {!sidebarCollapsed && (
          <div className="border-t border-white/10 px-4 py-3 font-mono text-[10px] text-sidebar-fg/35">
            <kbd className="rounded border border-white/15 px-1">⌘K</kbd> jump ·{' '}
            <kbd className="rounded border border-white/15 px-1">C</kbd> capture ·{' '}
            <kbd className="rounded border border-white/15 px-1">?</kbd> keys
          </div>
        )}
      </aside>
    </>
  )
}
