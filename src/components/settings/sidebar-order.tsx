'use client'

import { Eye, EyeOff, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/ui-store'
import { NAV_GROUPS, NAV_ITEMS } from '@/lib/nav/items'
import { cn } from '@/lib/utils'

/** Choose which sections appear in the sidebar. Groups are fixed; visibility is yours. */
export function SidebarOrderSettings(): React.ReactElement {
  const { hiddenNavItems, toggleNavItem, collapsedGroups, resetNav } = useUIStore()
  const isDefault = hiddenNavItems.length === 0 && collapsedGroups.length === 0

  return (
    <div className="space-y-4" data-testid="settings-sidebar">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold text-retro-dark">Sidebar sections</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Hide what you do not use. Groups fold from the sidebar itself.
          </p>
        </div>
        {!isDefault && (
          <Button variant="ghost" size="sm" onClick={resetNav}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {NAV_GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((i) => i.group === group.key && i.href !== '/')
          if (items.length === 0) return null
          return (
            <div key={group.key} className="surface-glass rounded-xl p-3">
              <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-retro-dark/50">
                {group.label}
              </p>
              <ul className="space-y-1">
                {items.map((item) => {
                  const hidden = hiddenNavItems.includes(item.href)
                  const Icon = item.icon
                  return (
                    <li key={item.href}>
                      <button
                        type="button"
                        onClick={() => toggleNavItem(item.href)}
                        aria-pressed={!hidden}
                        data-testid={`settings-nav-toggle-${item.href}`}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-retro-blue/5',
                          hidden ? 'text-retro-dark/40' : 'text-retro-dark'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className={cn('flex-1', hidden && 'line-through')}>{item.label}</span>
                        {hidden ? (
                          <EyeOff className="h-3.5 w-3.5 text-retro-dark/30" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-retro-dark/50" />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
