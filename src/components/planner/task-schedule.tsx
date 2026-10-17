'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Clock, Timer } from 'lucide-react'
import { PriorityBadge } from '@/components/tasks/priority-badge'
import { formatMinutes } from '@/lib/planner/capacity'
import { TaskCheck } from '@/components/tasks/task-check'
import { GoalChip } from './focus-tasks'
import { cn } from '@/lib/utils'
import type { TaskResponse } from '@/lib/types/tasks'
import type { PlannerGoal } from '@/lib/types/planner'

interface TaskScheduleProps {
  tasks: TaskResponse[]
  goals?: PlannerGoal[]
  onToggleComplete: (taskId: string, completed: boolean) => void
  emptyMessage?: string
  testId?: string
}

export function TaskSchedule({
  tasks,
  goals = [],
  onToggleComplete,
  emptyMessage = 'Nothing else due today',
  testId = 'due-today-list',
}: TaskScheduleProps) {
  const goalsById = new Map(goals.map((g) => [g.id, g]))

  if (tasks.length === 0) {
    return (
      <div className="surface-outline rounded-2xl p-6 text-center">
        <Clock className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <ul
      className="surface-glass divide-y divide-border/60 overflow-hidden rounded-2xl"
      data-testid={testId}
    >
      <AnimatePresence initial={false}>
        {tasks.map((task) => {
          const isCompleted = task.status === 'completed'
          const goal = task.goalId ? goalsById.get(task.goalId) : undefined
          return (
            <motion.li
              key={task.id}
              layout
              data-testid={`due-row-${task.id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 transition-colors',
                isCompleted && 'bg-retro-mint/5'
              )}
            >
              <TaskCheck
                checked={isCompleted}
                onChange={(next) => onToggleComplete(task.id, next)}
                label={task.title}
                size="sm"
                data-testid={`due-toggle-${task.id}`}
              />
              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-sm text-retro-dark',
                  isCompleted && 'text-muted-foreground line-through decoration-retro-mint/70'
                )}
              >
                {task.title}
              </span>
              {task.estimatedMinutes != null && !isCompleted && (
                <span
                  className="hidden items-center gap-1 font-mono text-[11px] text-retro-dark/50 sm:inline-flex"
                  title="Estimate"
                >
                  <Timer className="h-3 w-3" />
                  {formatMinutes(task.estimatedMinutes)}
                </span>
              )}
              {goal && <GoalChip goal={goal} />}
              <PriorityBadge priority={task.priority} />
            </motion.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}
