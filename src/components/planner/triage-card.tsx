'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CalendarDays, Check, Sunrise, X } from 'lucide-react'
import { Card, CardLabel } from '@/components/ui/card'
import { PriorityBadge } from '@/components/tasks/priority-badge'
import { addDays, dateFromKey, formatDateKey } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { TaskResponse } from '@/lib/types/tasks'
import type { TriageRequest } from '@/lib/types/planner'

interface TriageCardProps {
  tasks: TaskResponse[]
  /** Today's date key in the user's zone. */
  today: string
  onTriage: (decision: TriageRequest) => void
}

/** Monday strictly after `today`. */
export function nextMondayKey(today: string): string {
  const dow = dateFromKey(today).getUTCDay() // 0 = Sunday
  const delta = (8 - dow) % 7 || 7
  return addDays(today, delta)
}

function MoveOptions({
  taskId,
  today,
  onPick,
}: {
  taskId: string
  today: string
  onPick: (date: string) => void
}) {
  const tomorrow = addDays(today, 1)
  const monday = nextMondayKey(today)
  const [custom, setCustom] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      className="overflow-hidden"
    >
      <div className="flex flex-wrap items-center gap-2 pb-1 pl-9 pt-2">
        <button
          type="button"
          data-testid={`triage-move-${taskId}-tomorrow`}
          onClick={() => onPick(tomorrow)}
          className="rounded-full border border-retro-blue/30 bg-retro-blue/5 px-3 py-1 font-mono text-xs text-retro-dark transition-colors hover:bg-retro-blue/15"
        >
          Tomorrow · {formatDateKey(tomorrow, { weekday: 'short' })}
        </button>
        <button
          type="button"
          data-testid={`triage-move-${taskId}-next-monday`}
          onClick={() => onPick(monday)}
          className="rounded-full border border-retro-blue/30 bg-retro-blue/5 px-3 py-1 font-mono text-xs text-retro-dark transition-colors hover:bg-retro-blue/15"
        >
          Next Monday · {formatDateKey(monday, { day: 'numeric', month: 'short' })}
        </button>
        <label className="flex items-center gap-1.5 rounded-full border border-retro-dark/15 px-2 py-1 font-mono text-xs text-retro-dark/70">
          <CalendarDays className="h-3.5 w-3.5" />
          <input
            type="date"
            min={tomorrow}
            value={custom}
            data-testid={`triage-move-${taskId}-date`}
            onChange={(e) => {
              setCustom(e.target.value)
              if (e.target.value && e.target.value > today) onPick(e.target.value)
            }}
            className="bg-transparent text-xs focus:outline-none"
          />
        </label>
      </div>
    </motion.div>
  )
}

/**
 * Yesterday's leftovers with a decision per task: keep it today, move it to
 * a later date, or drop it. Renders nothing when there is nothing to decide.
 */
export function TriageCard({ tasks, today, onTriage }: TriageCardProps) {
  const [moving, setMoving] = useState<string | null>(null)

  if (tasks.length === 0) return null

  return (
    <Card data-testid="triage-card" className="border-retro-yellow/50">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-retro-yellow/30">
          <Sunrise className="h-4 w-4 text-retro-dark" />
        </span>
        <div>
          <CardLabel>Morning triage</CardLabel>
          <p className="text-sm font-medium text-retro-dark">
            Yesterday left {tasks.length} task{tasks.length === 1 ? '' : 's'} behind. Decide each
            one.
          </p>
        </div>
      </div>

      <ul className="divide-y divide-border/60">
        <AnimatePresence initial={false}>
          {tasks.map((task) => {
            const isMoving = moving === task.id
            return (
              <motion.li
                key={task.id}
                layout
                data-testid={`triage-row-${task.id}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                className="py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-retro-yellow" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-retro-dark">{task.title}</p>
                  </div>
                  <PriorityBadge priority={task.priority} className="hidden sm:inline-flex" />
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      data-testid={`triage-keep-${task.id}`}
                      aria-label={`Keep "${task.title}" for today`}
                      onClick={() => onTriage({ taskId: task.id, action: 'keep' })}
                      className="flex h-8 items-center gap-1 rounded-full bg-retro-mint/20 px-3 font-mono text-xs font-bold text-retro-dark transition-colors hover:bg-retro-mint/40"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Keep
                    </button>
                    <button
                      type="button"
                      data-testid={`triage-move-${task.id}`}
                      aria-label={`Move "${task.title}" to a later date`}
                      aria-expanded={isMoving}
                      onClick={() => setMoving(isMoving ? null : task.id)}
                      className={cn(
                        'flex h-8 items-center gap-1 rounded-full px-3 font-mono text-xs font-bold text-retro-dark transition-colors',
                        isMoving ? 'bg-retro-blue/25' : 'bg-retro-blue/10 hover:bg-retro-blue/20'
                      )}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      Move
                    </button>
                    <button
                      type="button"
                      data-testid={`triage-drop-${task.id}`}
                      aria-label={`Drop "${task.title}"`}
                      onClick={() => onTriage({ taskId: task.id, action: 'drop' })}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-retro-dark/40 transition-colors hover:bg-retro-pink/15 hover:text-retro-pink"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <AnimatePresence initial={false}>
                  {isMoving && (
                    <MoveOptions
                      key="move"
                      taskId={task.id}
                      today={today}
                      onPick={(date) => {
                        setMoving(null)
                        onTriage({ taskId: task.id, action: 'move', date })
                      }}
                    />
                  )}
                </AnimatePresence>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </Card>
  )
}
