'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckSquare, Inbox, Menu, Plus, Sun } from 'lucide-react'
import { useCommandStore } from '@/stores/command-store'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/', label: 'Today', icon: Sun },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
] as const

const TABS_RIGHT = [{ href: '/inbox', label: 'Inbox', icon: Inbox }] as const

/**
 * Phone navigation: Today, Tasks, a raised capture button, Inbox, and the
 * menu drawer. Slides away while a dialog is open or while typing.
 */
export function BottomNav() {
  const pathname = usePathname()
  const openCapture = useCommandStore((s) => s.openCapture)
  const dialogOpen = useCommandStore((s) => s.paletteOpen || s.captureOpen || s.helpOpen)
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

  const renderTab = (tab: { href: string; label: string; icon: typeof Sun }) => {
    const active = isActive(tab.href)
    return (
      <Link
        key={tab.href}
        href={tab.href}
        aria-current={active ? 'page' : undefined}
        data-testid={`bottom-nav-${tab.href}`}
        className={cn(
          'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors',
          active ? 'text-retro-blue' : 'text-retro-dark/50 hover:text-retro-dark'
        )}
      >
        {active && (
          <motion.span
            layoutId="bottom-nav-active"
            className="absolute inset-x-3 top-1 h-0.5 rounded-full bg-retro-blue"
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          />
        )}
        <tab.icon className="h-5 w-5" />
        {tab.label}
      </Link>
    )
  }

  return (
    <nav
      data-testid="bottom-nav"
      data-hidden={dialogOpen ? 'true' : 'false'}
      aria-label="Primary"
      className={cn(
        'pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-xl transition-transform duration-300 ease-smooth lg:hidden',
        dialogOpen && 'translate-y-full'
      )}
    >
      <div className="mx-auto flex max-w-lg items-stretch px-2">
        {TABS.map(renderTab)}
        <div className="flex flex-1 items-center justify-center">
          <motion.button
            type="button"
            data-testid="capture-fab"
            aria-label="Quick capture"
            onClick={() => openCapture()}
            whileTap={{ scale: 0.94 }}
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full border-2 border-retro-dark bg-retro-pink text-white shadow-hard"
          >
            <Plus className="h-6 w-6" />
          </motion.button>
        </div>
        {TABS_RIGHT.map(renderTab)}
        <button
          type="button"
          data-testid="bottom-nav-menu"
          onClick={() => setMobileSidebarOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-retro-dark/50 transition-colors hover:text-retro-dark"
        >
          <Menu className="h-5 w-5" />
          Menu
        </button>
      </div>
    </nav>
  )
}
