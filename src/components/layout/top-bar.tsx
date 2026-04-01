'use client'

import { Menu } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { Breadcrumbs } from './breadcrumbs'
import { UserMenu } from './user-menu'

export function TopBar() {
  const { setMobileSidebarOpen } = useUIStore()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="text-gray-500 hover:text-gray-700 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Breadcrumbs />
      </div>
      <UserMenu />
    </header>
  )
}
