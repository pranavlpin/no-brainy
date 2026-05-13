'use client'

import { Archive, Lock } from 'lucide-react'
import { useStashStats } from '@/hooks/use-stash'
import { Skeleton } from '@/components/ui/skeleton'

export function StashHome() {
  const { data: stats, isLoading } = useStashStats()

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <Archive className="h-12 w-12 text-muted-foreground/40" />
      <h2 className="mt-4 font-display text-xl font-bold text-retro-dark">Stash</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a channel from the left.
      </p>

      <div className="mt-6 h-px w-24 bg-border" />

      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        Sensitive channels stay encrypted at rest.
      </p>

      <div className="mt-3 font-mono text-xs text-muted-foreground">
        {isLoading ? (
          <Skeleton className="h-3.5 w-32" />
        ) : stats ? (
          <span>
            {stats.channelCount} channel{stats.channelCount === 1 ? '' : 's'} ·{' '}
            {stats.messageCount} item{stats.messageCount === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>
    </div>
  )
}
