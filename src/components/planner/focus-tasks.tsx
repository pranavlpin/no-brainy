'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Target, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Card, CardLabel } from '@/components/ui/card'
import { PriorityBadge } from '@/components/tasks/priority-badge'
import { TaskCheck } from '@/components/tasks/task-check'
import { cn } from '@/lib/utils'
import type { TaskResponse } from '@/lib/types/tasks'
import type { PlannerGoal } from '@/lib/types/planner'

interface FocusTasksProps {
  focusTasks: TaskResponse[]
  focusTaskIds: string[]
  allTasks: TaskResponse[]
  goals?: PlannerGoal[]
  onUpdate: (focusTaskIds: string[]) => void
  onToggleComplete: (taskId: string, completed: boolean) => void
}

const SLOT_COUNT = 3

const GOAL_TONES: Record<string, string> = {
  fitness: 'green',
  learning: 'blue',
  work: 'default',
  personal: 'orange',
  financial: 'yellow',
}

export function GoalChip({ goal }: { goal: PlannerGoal }) {
  const tone = (goal.category && GOAL_TONES[goal.category]) || 'default'
  return (
    <Badge
      variant={tone as 'green' | 'blue' | 'default' | 'orange' | 'yellow'}
      className="max-w-[160px] truncate text-[10px]"
      title={goal.title}
      data-testid={`goal-chip-${goal.id}`}
    >
      {goal.title}
    </Badge>
  )
}

export function FocusTasks({
  focusTasks,
  focusTaskIds,
  allTasks,
  goals = [],
  onUpdate,
  onToggleComplete,
}: FocusTasksProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const goalsById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals])
  const emptySlots = Math.max(0, SLOT_COUNT - focusTasks.length)

  const available = useMemo(() => {
    const seen = new Set<string>()
    return allTasks.filter((t) => {
      if (seen.has(t.id)) return false
      seen.add(t.id)
      if (focusTaskIds.includes(t.id)) return false
      if (t.status === 'completed' || t.status === 'cancelled') return false
      if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [allTasks, focusTaskIds, query])

  const grouped = useMemo(() => {
    const groups = new Map<string | null, TaskResponse[]>()
    for (const t of available) {
      const key = t.goalId && goalsById.has(t.goalId) ? t.goalId : null
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(t)
    }
    // Goal groups first, then ungrouped.
    return Array.from(groups.entries()).sort((a, b) => {
      if (a[0] === null) return 1
      if (b[0] === null) return -1
      return 0
    })
  }, [available, goalsById])

  const handleAdd = (taskId: string) => {
    if (focusTaskIds.length >= SLOT_COUNT) return
    onUpdate([...focusTaskIds, taskId])
    setPickerOpen(false)
    setQuery('')
  }

  const completedCount = focusTasks.filter((t) => t.status === 'completed').length

  return (
    <Card data-testid="focus-card">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-retro-blue/15">
          <Target className="h-4 w-4 text-retro-blue" />
        </span>
        <div className="flex-1">
          <CardLabel>Focus</CardLabel>
          <p className="text-sm font-medium text-retro-dark">The three that matter today</p>
        </div>
        <Badge variant="secondary" className="font-mono">
          {completedCount}/{focusTasks.length}
        </Badge>
      </div>

      <div className="grid gap-2">
        <AnimatePresence initial={false}>
          {focusTasks.map((task, index) => {
            const isCompleted = task.status === 'completed'
            const goal = task.goalId ? goalsById.get(task.goalId) : undefined
            return (
              <motion.div
                key={task.id}
                layout
                data-testid={`focus-slot-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                className={cn(
                  'group flex items-start gap-3 rounded-xl border p-3 transition-colors',
                  isCompleted
                    ? 'border-retro-mint/40 bg-retro-mint/10'
                    : 'border-border/70 bg-background/60 hover:border-retro-blue/40'
                )}
              >
                <span className="mt-1 font-mono text-[11px] font-bold text-retro-dark/30">
                  {index + 1}
                </span>
                <TaskCheck
                  checked={isCompleted}
                  onChange={(next) => onToggleComplete(task.id, next)}
                  label={task.title}
                  data-testid={`focus-toggle-${task.id}`}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'font-medium leading-snug text-retro-dark',
                      isCompleted && 'text-muted-foreground line-through decoration-retro-mint/70'
                    )}
                  >
                    {task.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <PriorityBadge priority={task.priority} />
                    {goal && <GoalChip goal={goal} />}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Remove "${task.title}" from focus`}
                  onClick={() => onUpdate(focusTaskIds.filter((id) => id !== task.id))}
                  className="shrink-0 rounded-md p-1 text-retro-dark/30 opacity-0 transition-all hover:bg-retro-pink/10 hover:text-retro-pink group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {Array.from({ length: emptySlots }).map((_, i) => {
          const index = focusTasks.length + i
          return (
            <motion.button
              key={`empty-${index}`}
              type="button"
              data-testid={`focus-slot-${index}`}
              onClick={() => setPickerOpen(true)}
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
              className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-retro-dark/20 p-3 text-sm text-retro-dark/50 transition-colors hover:border-retro-blue/50 hover:text-retro-blue"
            >
              <span className="font-mono text-[11px] font-bold text-retro-dark/30">
                {index + 1}
              </span>
              <Plus className="h-4 w-4" />
              Choose a focus task
            </motion.button>
          )
        })}
      </div>

      <Dialog
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false)
          setQuery('')
        }}
        title="Pick a focus task"
        description="Tasks are grouped by the goal they move forward."
        size="lg"
      >
        <Input
          autoFocus
          placeholder="Filter tasks…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="focus-picker-search"
        />
        <div className="mt-3 max-h-80 space-y-4 overflow-y-auto pr-1">
          {available.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nothing to pick from. Capture a task first.
            </p>
          ) : (
            grouped.map(([goalId, tasks]) => {
              const goal = goalId ? goalsById.get(goalId) : undefined
              return (
                <div key={goalId ?? 'none'}>
                  <p className="mb-1.5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-retro-dark/50">
                    {goal ? (
                      <>
                        <Target className="h-3 w-3" />
                        {goal.title}
                      </>
                    ) : (
                      'No goal'
                    )}
                  </p>
                  <div className="space-y-1.5">
                    {tasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        data-testid={`focus-pick-${task.id}`}
                        onClick={() => handleAdd(task.id)}
                        className="flex w-full items-center gap-3 rounded-lg border border-border/70 bg-background/70 p-3 text-left transition-colors hover:border-retro-blue/40 hover:bg-retro-blue/5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-retro-dark">
                            {task.title}
                          </p>
                        </div>
                        <PriorityBadge priority={task.priority} />
                      </button>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Dialog>
    </Card>
  )
}
