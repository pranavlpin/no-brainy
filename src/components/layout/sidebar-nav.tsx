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

export function SidebarNavItem({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const { sidebarCollapsed, setMobileSidebarOpen } = useUIStore()
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

  return (
    <Link
      href={item.href}
      onClick={() => setMobileSidebarOpen(false)}
      title={sidebarCollapsed ? item.label : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        sidebarCollapsed && 'justify-center px-2',
        isActive
          ? 'bg-primary/10 text-blue-400'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {!sidebarCollapsed && <span>{item.label}</span>}
    </Link>
  )
}
