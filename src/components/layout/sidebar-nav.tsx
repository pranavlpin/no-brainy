'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export function SidebarNavItem({ item, expanded = false }: { item: NavItem; expanded?: boolean }) {
  const pathname = usePathname()
  const { sidebarCollapsed, setMobileSidebarOpen } = useUIStore()
  const collapsed = sidebarCollapsed && !expanded
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

  return (
    <Link
      href={item.href}
      onClick={() => setMobileSidebarOpen(false)}
      title={item.label}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors',
        collapsed && 'justify-center px-2',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-sidebar-fg/60 hover:bg-sidebar-fg/5 hover:text-sidebar-fg'
      )}
    >
      <item.icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  )
}
