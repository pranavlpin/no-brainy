'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarCheck, ListChecks, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PriorityBadge } from './priority-badge'
import { TaskCheck } from './task-check'
import { Badge } from '@/components/ui/badge'
import { useUpdateTask } from '@/hooks/use-tasks'
import { usePrefersReducedMotion } from '@/components/motion/use-prefers-reduced-motion'
import { useCoarsePointer } from '@/components/motion/use-coarse-pointer'
import { Check } from 'lucide-react'
import { formatEstimate } from '@/components/tasks/task-planning-fields'
import { browserTimezone, relativeDayLabel, todayKey } from '@/lib/dates'
import type { TaskResponse, TaskStatus } from '@/lib/types/tasks'

interface TaskListItem extends TaskResponse {
  subtasksCount?: number
}

interface TaskListProps {
  tasks: TaskListItem[]
  /** Collapse completed rows out of the list after a short hold. */
  hideCompleted?: boolean
  /** Hold duration in ms before a completed row leaves. */
  holdMs?: number
  emptyMessage?: string
}

function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === 'completed' || status === 'cancelled') return false
  return new Date(dueDate) < new Date()
}

function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function TaskList({
  tasks,
  hideCompleted = false,
  holdMs = 600,
  emptyMessage = 'No tasks found. Create one to get started.',
}: TaskListProps) {
  const router = useRouter()
  const updateTask = useUpdateTask()
  const reducedMotion = usePrefersReducedMotion()
  const coarsePointer = useCoarsePointer()
  const SWIPE_THRESHOLD = 96
  const [today, setToday] = useState(() => todayKey(browserTimezone()))
  useEffect(() => {
    setToday(todayKey(browserTimezone()))
  }, [])

  // Local status overrides give an instant flip even before the cache updates;
  // they are dropped as soon as the incoming prop agrees.
  const [overrides, setOverrides] = useState<Record<string, TaskStatus>>({})
  // Rows completed moments ago stay visible for `holdMs` so the check is seen.
  const [holding, setHolding] = useState<Set<string>>(() => new Set())
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    setOverrides((prev) => {
      let changed = false
      const next = { ...prev }
      for (const t of tasks) {
        if (next[t.id] !== undefined && next[t.id] === t.status) {
          delete next[t.id]
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [tasks])

  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach((t) => clearTimeout(t))
    }
  }, [])

  const statusOf = useCallback(
    (task: TaskListItem): TaskStatus => overrides[task.id] ?? task.status,
    [overrides]
  )

  const handleToggle = (task: TaskListItem) => {
    const current = statusOf(task)
    const newStatus: TaskStatus = current === 'completed' ? 'pending' : 'completed'
    setOverrides((prev) => ({ ...prev, [task.id]: newStatus }))

    if (newStatus === 'completed' && hideCompleted) {
      const hold = reducedMotion ? 0 : holdMs
      if (hold > 0) {
        setHolding((prev) => new Set(prev).add(task.id))
        const existing = timers.current.get(task.id)
        if (existing) clearTimeout(existing)
        timers.current.set(
          task.id,
          setTimeout(() => {
            setHolding((prev) => {
              const next = new Set(prev)
              next.delete(task.id)
              return next
            })
            timers.current.delete(task.id)
          }, hold)
        )
      }
    } else {
      const existing = timers.current.get(task.id)
      if (existing) clearTimeout(existing)
      setHolding((prev) => {
        if (!prev.has(task.id)) return prev
        const next = new Set(prev)
        next.delete(task.id)
        return next
      })
    }

    updateTask.mutate({ id: task.id, data: { status: newStatus } })
  }

  const visible = useMemo(
    () =>
      tasks.filter((t) => {
        if (!hideCompleted) return true
        const status = statusOf(t)
        return status !== 'completed' || holding.has(t.id)
      }),
    [tasks, hideCompleted, holding, statusOf]
  )

  // Under reduced motion rows mount and leave instantly; otherwise they
  // fade in and collapse out.
  const rowMotion = reducedMotion
    ? {}
    : {
        layout: true as const,
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, overflow: 'hidden' },
        transition: {
          duration: 0.24,
          ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
        },
      }

  if (tasks.length === 0) {
    return (
      <div className="surface-outline rounded-2xl py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <motion.ul
      layout={!reducedMotion}
      className="surface-glass divide-y divide-border/60 overflow-hidden rounded-2xl"
      data-testid="task-list"
    >
      <AnimatePresence initial={false}>
        {visible.map((task) => {
          const status = statusOf(task)
          const completed = status === 'completed'
          const overdue = isOverdue(task.dueDate, status)

          return (
            <motion.li
              key={task.id}
              data-testid={`task-row-${task.id}`}
              {...rowMotion}
              onClick={() => router.push(`/tasks/${task.id}`)}
              className={cn(
                'group relative flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-retro-blue/5',
                completed && 'bg-retro-mint/5'
              )}
              {...(coarsePointer && !completed
                ? {
                    drag: 'x' as const,
                    dragConstraints: { left: 0, right: SWIPE_THRESHOLD + 24 },
                    dragElastic: 0.08,
                    dragSnapToOrigin: true,
                    onDragEnd: (_e: unknown, info: { offset: { x: number } }) => {
                      if (info.offset.x >= SWIPE_THRESHOLD) handleToggle(task)
                    },
                  }
                : {})}
            >
              {coarsePointer && !completed && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 flex w-24 items-center justify-start pl-4 text-retro-mint opacity-0 group-active:opacity-100"
                >
                  <Check className="h-5 w-5" />
                </span>
              )}
              <TaskCheck
                checked={completed}
                onChange={() => handleToggle(task)}
                label={task.title}
                size="sm"
                data-testid={`task-toggle-${task.id}`}
              />

              <div className="min-w-0 flex-1">
                <span
                  className={cn(
                    'text-sm font-medium transition-colors',
                    completed && 'text-muted-foreground line-through decoration-retro-mint/70'
                  )}
                >
                  {task.title}
                </span>
                {(task.tags.length > 0 || task.plannedDate || task.estimatedMinutes) && (
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {task.plannedDate && !completed && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-retro-blue/10 px-1.5 py-0 font-mono text-[11px] text-retro-blue"
                        title="Planned day"
                      >
                        <CalendarCheck className="h-3 w-3" />
                        {relativeDayLabel(task.plannedDate, today)}
                      </span>
                    )}
                    {task.estimatedMinutes && !completed ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-retro-dark/5 px-1.5 py-0 font-mono text-[11px] text-retro-dark/70"
                        title="Estimate"
                      >
                        <Timer className="h-3 w-3" />
                        {formatEstimate(task.estimatedMinutes)}
                      </span>
                    ) : null}
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="px-1.5 py-0 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {task.subtasksCount != null && task.subtasksCount > 0 && (
                <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <ListChecks className="h-3.5 w-3.5" />
                  {task.subtasksCount}
                </div>
              )}

              <span
                className={cn(
                  'w-16 shrink-0 text-right text-xs',
                  task.dueDate
                    ? overdue
                      ? 'font-medium text-retro-pink'
                      : 'text-muted-foreground'
                    : 'text-transparent'
                )}
              >
                {task.dueDate ? formatDueDate(task.dueDate) : '—'}
              </span>

              <PriorityBadge priority={task.priority} />
            </motion.li>
          )
        })}
      </AnimatePresence>
    </motion.ul>
  )
}
