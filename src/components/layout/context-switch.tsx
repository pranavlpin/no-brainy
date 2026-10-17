'use client'

import { Briefcase, Home, Layers } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { WORKSPACE_CONTEXTS, type WorkspaceContext } from '@/lib/tasks/context'
import { cn } from '@/lib/utils'

/** Top-bar filter over Work / Personal. Unclassified items always show. */
export function ContextSwitch({ className }: { className?: string }) {
  const context = useUIStore((s) => s.context)
  const setContext = useUIStore((s) => s.setContext)
  const Icon = context === 'work' ? Briefcase : context === 'personal' ? Home : Layers
  return (
    <label
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs transition-colors',
        context === 'all'
          ? 'border-border/70 bg-background/60 text-muted-foreground'
          : 'border-retro-blue/40 bg-retro-blue/10 text-retro-dark',
        className
      )}
      title="Show everything, or only work or personal"
    >
      <Icon className="h-3.5 w-3.5" />
      <select
        aria-label="Context"
        data-testid="context-switch"
        value={context}
        onChange={(e) => setContext(e.target.value as WorkspaceContext)}
        className="bg-transparent pr-1 text-xs focus:outline-none"
      >
        {WORKSPACE_CONTEXTS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </label>
  )
}
