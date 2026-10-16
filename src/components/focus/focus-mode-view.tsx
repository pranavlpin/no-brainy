'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TaskCheck } from '@/components/tasks/task-check'
import { PomodoroTimer } from './pomodoro-timer'
import { useUIStore } from '@/stores/ui-store'
import { useFocusStore } from '@/stores/focus-store'
import { useTask, useUpdateTask } from '@/hooks/use-tasks'
import { useTaskLinks } from '@/hooks/use-links'
import { useFocusSessions } from '@/hooks/use-focus-sessions'

/**
 * Distraction-free view: one task, the timer, and the day's deep-work
 * total. Escape returns to the app while the timer keeps running.
 */
export function FocusModeView() {
  const { focusTaskId, exitFocusMode } = useUIStore()
  const storeTaskId = useFocusStore((s) => s.taskId)
  const taskId = focusTaskId || storeTaskId || undefined
  const { data: task } = useTask(taskId)
  const updateTask = useUpdateTask()
  const { data: taskLinks } = useTaskLinks(taskId ?? '')
  const { data: today } = useFocusSessions()
  const [notesOpen, setNotesOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitFocusMode()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [exitFocusMode])

  const isCompleted = task?.status === 'completed'
  const linkedNotes = taskLinks?.filter((l) => l.linkedType === 'note') ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
      data-testid="focus-mode"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        onClick={exitFocusMode}
        aria-label="Leave focus mode"
      >
        <X className="h-5 w-5" />
      </Button>

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        className="w-full max-w-lg"
      >
        <Card className="space-y-8 px-6 py-8 sm:px-10">
          {task ? (
            <div className="text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-retro-dark/50">
                Working on
              </p>
              <h1 className="mt-2 font-display text-2xl font-bold leading-snug text-retro-dark">
                {task.title}
              </h1>
              {task.descriptionMd && (
                <p className="mx-auto mt-2 max-h-28 max-w-md overflow-y-auto whitespace-pre-wrap text-sm text-muted-foreground">
                  {task.descriptionMd}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-retro-dark/50">
                Open focus
              </p>
              <h1 className="mt-2 font-display text-2xl font-bold text-retro-dark">
                One block. One thing.
              </h1>
            </div>
          )}

          <PomodoroTimer taskId={task?.id ?? null} taskTitle={task?.title ?? null} />

          {task && (
            <div className="flex items-center justify-center gap-3">
              <TaskCheck
                checked={!!isCompleted}
                label={task.title}
                onChange={(next) =>
                  updateTask.mutate({
                    id: task.id,
                    data: { status: next ? 'completed' : 'in_progress' },
                  })
                }
                data-testid="focus-task-toggle"
              />
              <span className="text-sm text-retro-dark/70">
                {isCompleted ? 'Done. Nice.' : 'Mark complete'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border/60 pt-4 font-mono text-xs text-retro-dark/60">
            <span>
              Today: <strong className="text-retro-dark">{today?.totalWorkMinutes ?? 0} min</strong>{' '}
              deep work
            </span>
            <span>{today?.pomodorosCompleted ?? 0} pomodoros</span>
          </div>

          {linkedNotes.length > 0 && (
            <div className="border-t border-border/60 pt-4">
              <button
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setNotesOpen(!notesOpen)}
              >
                {notesOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Linked notes ({linkedNotes.length})
              </button>
              {notesOpen && (
                <ul className="mt-2 space-y-1 pl-6">
                  {linkedNotes.map((link) => (
                    <li key={link.linkedId} className="text-sm text-muted-foreground">
                      {link.title || link.linkedId}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <p className="text-center font-mono text-[11px] text-retro-dark/40">
            esc leaves this view · the timer keeps going in the top bar
          </p>
        </Card>
      </motion.div>
    </div>
  )
}
