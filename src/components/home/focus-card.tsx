'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Target } from 'lucide-react'
import { Card, CardLabel } from '@/components/ui/card'
import { TaskCheck } from '@/components/tasks/task-check'
import { PriorityBadge } from '@/components/tasks/priority-badge'
import { GoalChip } from '@/components/planner/focus-tasks'
import { useUpdateTask } from '@/hooks/use-tasks'
import { cn } from '@/lib/utils'
import type { TaskResponse } from '@/lib/types/tasks'
import type { HomeGoal } from '@/lib/types/home'

interface FocusCardProps {
  focusTasks: TaskResponse[]
  dueToday: TaskResponse[]
  goals: HomeGoal[]
  carryForwardCount: number
}

/** Today's three focus tasks plus anything else due, with instant toggles. */
export function FocusCard({ focusTasks, dueToday, goals, carryForwardCount }: FocusCardProps) {
  const updateTask = useUpdateTask()
  const goalsById = new Map(goals.map((g) => [g.id, g]))
  const others = dueToday.filter((t) => !focusTasks.some((f) => f.id === t.id))
  const done = focusTasks.filter((t) => t.status === 'completed').length

  const toggle = (task: TaskResponse, next: boolean) =>
    updateTask.mutate({ id: task.id, data: { status: next ? 'completed' : 'pending' } })

  const renderRow = (task: TaskResponse, index?: number) => {
    const completed = task.status === 'completed'
    const goal = task.goalId ? goalsById.get(task.goalId) : undefined
    return (
      <motion.li
        key={task.id}
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
        transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
        data-testid={index != null ? `home-focus-slot-${index}` : `home-due-${task.id}`}
        className={cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
          completed ? 'bg-retro-mint/10' : 'hover:bg-retro-blue/5'
        )}
      >
        {index != null && (
          <span className="w-3 font-mono text-[11px] font-bold text-retro-dark/30">
            {index + 1}
          </span>
        )}
        <TaskCheck
          checked={completed}
          onChange={(next) => toggle(task, next)}
          label={task.title}
          size={index != null ? 'md' : 'sm'}
          data-testid={`home-toggle-${task.id}`}
        />
        <Link
          href={`/tasks/${task.id}`}
          className={cn(
            'min-w-0 flex-1 truncate text-sm font-medium text-retro-dark hover:underline',
            completed && 'text-muted-foreground line-through decoration-retro-mint/70'
          )}
        >
          {task.title}
        </Link>
        {goal && <GoalChip goal={goal} />}
        <PriorityBadge priority={task.priority} className="hidden sm:inline-flex" />
      </motion.li>
    )
  }

  return (
    <Card data-testid="home-focus" className="flex flex-col">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-retro-blue/15">
          <Target className="h-4 w-4 text-retro-blue" />
        </span>
        <div className="flex-1">
          <CardLabel>Focus</CardLabel>
          <p className="text-sm font-medium text-retro-dark">
            {focusTasks.length > 0 ? `${done} of ${focusTasks.length} done` : 'Nothing chosen yet'}
          </p>
        </div>
        <Link
          href="/planner"
          className="flex items-center gap-1 font-mono text-xs text-retro-blue hover:underline"
        >
          Planner <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {focusTasks.length === 0 ? (
        <Link
          href="/planner"
          className="surface-outline flex flex-col items-center justify-center rounded-xl px-4 py-8 text-center text-sm text-retro-dark/60 transition-colors hover:border-retro-blue/50 hover:text-retro-blue"
        >
          <span className="font-medium">Pick three tasks for today</span>
          {carryForwardCount > 0 && (
            <span className="mt-1 font-mono text-xs text-retro-dark/50">
              {carryForwardCount} leftover{carryForwardCount === 1 ? '' : 's'} waiting for triage
            </span>
          )}
        </Link>
      ) : (
        <ul className="space-y-1">
          <AnimatePresence initial={false}>
            {focusTasks.map((t, i) => renderRow(t, i))}
          </AnimatePresence>
        </ul>
      )}

      {others.length > 0 && (
        <div className="mt-4 border-t border-border/60 pt-3">
          <CardLabel className="mb-1 px-1">Also due today</CardLabel>
          <ul data-testid="home-due" className="space-y-0.5">
            <AnimatePresence initial={false}>{others.map((t) => renderRow(t))}</AnimatePresence>
          </ul>
        </div>
      )}
    </Card>
  )
}
