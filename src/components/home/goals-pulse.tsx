'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, Target } from 'lucide-react'
import { Card, CardLabel } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { HomeGoal } from '@/lib/types/home'

const STALE_DAYS = 7

function activityLabel(days: number): string {
  if (days === 0) return 'active today'
  if (days === 1) return 'active yesterday'
  return `${days} days quiet`
}

/** Active goals with progress and how recently each one moved. */
export function GoalsPulse({ goals, staleCount }: { goals: HomeGoal[]; staleCount: number }) {
  const sorted = [...goals].sort((a, b) => b.daysSinceActivity - a.daysSinceActivity)

  return (
    <Card data-testid="home-goals">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-retro-mint/20">
          <Target className="h-4 w-4 text-retro-mint" />
        </span>
        <div className="flex-1">
          <CardLabel>Goals</CardLabel>
          <p className="text-sm font-medium text-retro-dark">
            {goals.length === 0
              ? 'No active goals'
              : staleCount > 0
                ? `${staleCount} need${staleCount === 1 ? 's' : ''} attention`
                : 'All goals moving'}
          </p>
        </div>
        <Link href="/goals" className="font-mono text-xs text-retro-blue hover:underline">
          All goals →
        </Link>
      </div>

      {goals.length === 0 ? (
        <Link
          href="/goals"
          className="surface-outline flex items-center justify-center rounded-xl px-4 py-6 text-sm text-retro-dark/60 transition-colors hover:border-retro-mint/60 hover:text-retro-dark"
        >
          Set a goal to give tasks a direction
        </Link>
      ) : (
        <ul className="space-y-2.5">
          {sorted.slice(0, 5).map((g) => {
            const pct = g.taskCount > 0 ? Math.round((g.completedTaskCount / g.taskCount) * 100) : 0
            const stale = g.daysSinceActivity >= STALE_DAYS
            return (
              <li key={g.id} data-testid={`home-goal-${g.id}`}>
                <Link
                  href={`/goals/${g.id}`}
                  className="block rounded-lg px-1 py-1 hover:bg-retro-blue/5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      {stale && <AlertCircle className="h-3.5 w-3.5 shrink-0 text-retro-pink" />}
                      <span className="truncate text-sm font-medium text-retro-dark">
                        {g.title}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'shrink-0 font-mono text-[11px]',
                        stale ? 'text-retro-pink' : 'text-retro-dark/50'
                      )}
                    >
                      {activityLabel(g.daysSinceActivity)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-retro-dark/10">
                      <motion.div
                        className={cn(
                          'h-full rounded-full',
                          stale ? 'bg-retro-pink/70' : 'bg-retro-mint'
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono text-[11px] text-retro-dark/50">
                      {g.taskCount > 0 ? `${g.completedTaskCount}/${g.taskCount}` : '—'}
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
