'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Gauge, Scissors, Settings2 } from 'lucide-react'
import { Card, CardLabel } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Collapse } from '@/components/motion'
import { formatMinutes, planCapacity, tasksToMoveForSmallerDay } from '@/lib/planner/capacity'
import { priorityRank } from '@/lib/tasks/priority'
import { cn } from '@/lib/utils'
import type { CapacitySettings, TimeBlock } from '@/lib/types/planner'

export interface CapacityTaskLike {
  id: string
  title: string
  estimatedMinutes: number | null
  priority: string
  status: string
}

interface CapacityCardProps extends CapacitySettings {
  /** Every task that counts toward today, deduplicated by the caller or here. */
  tasks: CapacityTaskLike[]
  blocks: TimeBlock[]
  /** Task ids that "Make a smaller day" must never move (the three focus tasks). */
  protectedIds?: string[]
  onChange: (patch: Partial<CapacitySettings>) => void
  /** Move these tasks to tomorrow. */
  onMoveTasks: (taskIds: string[]) => void
}

function NumberField({
  id,
  label,
  value,
  onCommit,
  max = 1440,
}: {
  id: string
  label: string
  value: number
  onCommit: (n: number) => void
  max?: number
}) {
  const [draft, setDraft] = useState(String(value))
  const [focused, setFocused] = useState(false)
  // Follow the server value only while the field is not being edited, so a
  // background refetch never wipes a half-typed number.
  useEffect(() => {
    if (!focused) setDraft(String(value))
  }, [value, focused])
  const commit = () => {
    const n = Number.parseInt(draft, 10)
    const next = Number.isFinite(n) ? Math.min(Math.max(n, 0), max) : value
    setDraft(String(next))
    if (next !== value) onCommit(next)
  }
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[11px] text-retro-dark/60">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          commit()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
        className="h-8 font-mono text-sm"
      />
    </div>
  )
}

/**
 * Planned versus available minutes for the day, with honest warnings:
 * tasks without estimates stay visible as unknown, overlapping blocks are
 * called out, and an over-full day offers one action to shrink it.
 */
export function CapacityCard({
  tasks,
  blocks,
  availableMinutes,
  bufferMinutes,
  workStart,
  workEnd,
  protectedIds = [],
  onChange,
  onMoveTasks,
}: CapacityCardProps) {
  const [editing, setEditing] = useState(false)

  const openTasks = useMemo(() => {
    const seen = new Set<string>()
    return tasks.filter((t) => {
      if (seen.has(t.id) || t.status === 'completed' || t.status === 'cancelled') return false
      seen.add(t.id)
      return true
    })
  }, [tasks])

  const result = useMemo(
    () =>
      planCapacity({
        tasks: openTasks,
        blocks: blocks.filter((b) => !b.isCompleted),
        availableMinutes,
        bufferMinutes,
        workStart,
        workEnd,
      }),
    [openTasks, blocks, availableMinutes, bufferMinutes, workStart, workEnd]
  )

  const pct =
    result.availableMinutes > 0
      ? Math.min(100, Math.round((result.plannedMinutes / result.availableMinutes) * 100))
      : 100
  const over = result.overBy > 0
  const unknown = result.unknownTaskIds.length
  const movable = tasksToMoveForSmallerDay(
    openTasks.map((t) => ({
      id: t.id,
      estimatedMinutes: t.estimatedMinutes,
      priorityRank: priorityRank(t.priority),
      protected: protectedIds.includes(t.id),
    })),
    result.overBy
  )

  const messages: string[] = []
  if (over) messages.push(`Over by ${formatMinutes(result.overBy)}.`)
  if (unknown)
    messages.push(
      `${unknown} task${unknown === 1 ? '' : 's'} without an estimate ${unknown === 1 ? 'is' : 'are'} not counted.`
    )
  if (result.overlaps.length) messages.push('Some time blocks overlap.')
  const windowCapped =
    workStart && workEnd && result.availableMinutes < availableMinutes
      ? `Capped to your ${workStart}–${workEnd} window.`
      : null

  return (
    <Card data-testid="capacity-card" data-over={over || undefined}>
      <div className="mb-3 flex items-center gap-2">
        <span
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full',
            over ? 'bg-retro-orange/25' : 'bg-retro-mint/20'
          )}
        >
          <Gauge className={cn('h-4 w-4', over ? 'text-retro-orange' : 'text-retro-dark')} />
        </span>
        <div className="min-w-0 flex-1">
          <CardLabel>Capacity</CardLabel>
          <p className="text-sm font-medium text-retro-dark" data-testid="capacity-summary">
            <span className="font-mono">{formatMinutes(result.plannedMinutes)}</span> planned of{' '}
            <span className="font-mono">{formatMinutes(result.availableMinutes)}</span> available
          </p>
        </div>
        <button
          type="button"
          aria-expanded={editing}
          aria-controls="capacity-control"
          onClick={() => setEditing((v) => !v)}
          className="flex h-8 items-center gap-1 rounded-full px-3 font-mono text-xs text-retro-dark/60 transition-colors hover:bg-retro-dark/5 hover:text-retro-dark"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Adjust
        </button>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-retro-dark/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={result.availableMinutes}
        aria-valuenow={Math.min(result.plannedMinutes, result.availableMinutes)}
        aria-label="Day load"
      >
        <motion.div
          className={cn(
            'h-full rounded-full',
            over
              ? 'bg-gradient-to-r from-retro-orange to-retro-pink'
              : 'bg-gradient-to-r from-retro-blue to-retro-mint'
          )}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
        <p
          role="status"
          className={cn(
            'min-h-[1rem] font-mono text-[11px]',
            over ? 'text-retro-orange' : 'text-retro-dark/60'
          )}
        >
          {messages.length ? (
            <>
              {(over || result.overlaps.length > 0) && (
                <AlertTriangle className="mr-1 inline h-3 w-3 align-[-2px]" />
              )}
              {messages.join(' ')}
            </>
          ) : result.fits ? (
            'Fits. Buffer included.'
          ) : (
            ''
          )}
          {windowCapped && <span className="ml-1 text-retro-dark/50">{windowCapped}</span>}
        </p>
        {over && movable.length > 0 && (
          <button
            type="button"
            onClick={() => onMoveTasks(movable)}
            className="flex h-7 items-center gap-1 rounded-full bg-retro-orange/15 px-3 font-mono text-[11px] font-bold text-retro-dark transition-colors hover:bg-retro-orange/30"
          >
            <Scissors className="h-3 w-3" />
            Make a smaller day
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {editing && (
          <Collapse key="control">
            <div
              id="capacity-control"
              data-testid="capacity-control"
              className="mt-3 grid grid-cols-2 gap-3 border-t border-border/60 pt-3 sm:grid-cols-4"
            >
              <NumberField
                id="capacity-available"
                label="Available minutes"
                value={availableMinutes}
                onCommit={(n) => onChange({ availableMinutes: n })}
              />
              <NumberField
                id="capacity-buffer"
                label="Buffer minutes"
                value={bufferMinutes}
                onCommit={(n) => onChange({ bufferMinutes: n })}
              />
              <div className="space-y-1">
                <Label htmlFor="capacity-work-start" className="text-[11px] text-retro-dark/60">
                  Work starts
                </Label>
                <Input
                  id="capacity-work-start"
                  type="time"
                  value={workStart ?? ''}
                  onChange={(e) => onChange({ workStart: e.target.value || null })}
                  className="h-8 font-mono text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="capacity-work-end" className="text-[11px] text-retro-dark/60">
                  Work ends
                </Label>
                <Input
                  id="capacity-work-end"
                  type="time"
                  value={workEnd ?? ''}
                  onChange={(e) => onChange({ workEnd: e.target.value || null })}
                  className="h-8 font-mono text-sm"
                />
              </div>
            </div>
          </Collapse>
        )}
      </AnimatePresence>
    </Card>
  )
}
