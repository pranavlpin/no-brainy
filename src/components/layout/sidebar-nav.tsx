'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { SPRING_LAYOUT } from '@/components/motion/motion-provider'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export function SidebarNavItem({ item, badge }: { item: NavItem; badge?: number }) {
  const pathname = usePathname()
  const { sidebarCollapsed, setMobileSidebarOpen } = useUIStore()
  const isActive =
    item.href === '/'
      ? pathname === '/'
      : pathname === item.href || pathname.startsWith(item.href + '/')

  return (
    <Link
      href={item.href}
      onClick={() => setMobileSidebarOpen(false)}
      title={item.label}
      aria-current={isActive ? 'page' : undefined}
      data-testid={`nav-item-${item.href}`}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        sidebarCollapsed && 'justify-center px-2',
        isActive ? 'text-sidebar-fg' : 'text-sidebar-fg/65 hover:text-sidebar-fg'
      )}
    >
      {isActive && (
        <motion.span
          layoutId="nav-active-pill"
          data-testid="nav-active-pill"
          className="absolute inset-0 rounded-lg bg-white/10 ring-1 ring-white/10"
          transition={SPRING_LAYOUT}
        />
      )}
      {!isActive && (
        <span className="absolute inset-0 rounded-lg bg-white/0 transition-colors group-hover:bg-white/5" />
      )}
      <item.icon
        className={cn(
          'relative z-10 h-5 w-5 shrink-0 transition-transform duration-200 ease-smooth group-hover:scale-105',
          isActive && 'text-retro-yellow'
        )}
      />
      {!sidebarCollapsed && <span className="relative z-10 flex-1 truncate">{item.label}</span>}
      {!sidebarCollapsed && badge != null && badge > 0 && (
        <span
          data-testid={`nav-badge-${item.href}`}
          className="relative z-10 rounded-full bg-retro-pink px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-white"
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}
