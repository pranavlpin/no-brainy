'use client'

import { motion } from 'framer-motion'
import { Check, Moon, Repeat, SkipForward } from 'lucide-react'
import { Card, CardLabel } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { EvidenceKind } from '@/lib/types/growth'

interface PracticeCardProps {
  practiceCount: number
  weeklyPracticeTarget: number | null
  weekLabel: string
  onLog: (kind: EvidenceKind) => void
  onSetTarget?: () => void
}

/**
 * Practice this week against the goal's target. Rest and skips are recorded
 * without penalty; the dots only ever fill, they never turn red.
 */
export function PracticeCard({ practiceCount, weeklyPracticeTarget, weekLabel, onLog, onSetTarget }: PracticeCardProps) {
  const target = weeklyPracticeTarget ?? 0
  const slots = Math.max(target, practiceCount, 1)
  const met = target > 0 && practiceCount >= target
  return (
    <Card data-testid="goal-practice">
      <div className="flex items-center gap-2">
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-full', met ? 'bg-retro-mint/25' : 'bg-retro-blue/15')}>
          <Repeat className={cn('h-4 w-4', met ? 'text-retro-dark' : 'text-retro-blue')} />
        </span>
        <div className="min-w-0 flex-1">
          <CardLabel>Practice · {weekLabel}</CardLabel>
          <p className="text-sm font-medium text-retro-dark">
            {target > 0
              ? met
                ? `${practiceCount} of ${target} days. Target met.`
                : `${practiceCount} of ${target} days so far`
              : practiceCount > 0
                ? `${practiceCount} practice day${practiceCount === 1 ? '' : 's'} this week`
                : 'No weekly target yet'}
          </p>
        </div>
        {target === 0 && onSetTarget && (
          <Button size="sm" variant="outline" onClick={onSetTarget}>
            Set a target
          </Button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" aria-label={`${practiceCount} practice days this week`}>
        {Array.from({ length: Math.min(slots, 14) }).map((_, i) => (
          <motion.span
            key={i}
            initial={false}
            animate={{ scale: i < practiceCount ? 1 : 0.85, opacity: i < practiceCount ? 1 : 0.35 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            className={cn('h-3 w-3 rounded-full', i < practiceCount ? 'bg-retro-mint' : 'bg-retro-dark/20')}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onLog('practice')} data-testid="practice-log">
          <Check className="mr-1 h-3.5 w-3.5" /> Log practice
        </Button>
        <Button size="sm" variant="outline" onClick={() => onLog('rest')} data-testid="practice-rest">
          <Moon className="mr-1 h-3.5 w-3.5" /> Rest
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onLog('skip')} data-testid="practice-skip">
          <SkipForward className="mr-1 h-3.5 w-3.5" /> Skip
        </Button>
      </div>
      <p className="mt-2 font-mono text-[11px] text-retro-dark/50">
        Finished focus sessions on this goal&apos;s tasks count as practice too.
      </p>
    </Card>
  )
}
