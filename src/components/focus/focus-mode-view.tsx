'use client'

import { useEffect, useState } from 'react'
import { X, ChevronDown, ChevronRight, CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PomodoroTimer } from './pomodoro-timer'
import { useUIStore } from '@/stores/ui-store'
import { useTask, useUpdateTask } from '@/hooks/use-tasks'
import { useTaskLinks } from '@/hooks/use-links'

export function FocusModeView() {
  const { focusTaskId, exitFocusMode } = useUIStore()
  const { data: task } = useTask(focusTaskId ?? undefined)
  const updateTask = useUpdateTask()
  const { data: taskLinks } = useTaskLinks(focusTaskId ?? '')
  const [notesOpen, setNotesOpen] = useState(false)

  // Escape key to exit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitFocusMode()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [exitFocusMode])

  const isCompleted = task?.status === 'completed'

  const toggleComplete = () => {
    if (!focusTaskId || !task) return
    updateTask.mutate({
      id: focusTaskId,
      data: {
        status: isCompleted ? 'in_progress' : 'completed',
      },
    })
  }

  const linkedNotes =
    taskLinks?.filter((l) => l.linkedType === 'note') ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        onClick={exitFocusMode}
      >
        <X className="h-5 w-5" />
      </Button>

      <div className="w-full max-w-lg px-6 py-8 space-y-8">
        {/* Task info */}
        {task && (
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-bold">{task.title}</h1>
            {task.descriptionMd && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                {task.descriptionMd}
              </p>
            )}
          </div>
        )}

        {/* Pomodoro timer */}
        <PomodoroTimer />

        {/* Status toggle */}
        {task && (
          <div className="flex justify-center">
            <Button
              variant={isCompleted ? 'secondary' : 'outline'}
              onClick={toggleComplete}
              disabled={updateTask.isPending}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  Completed
                </>
              ) : (
                <>
                  <Circle className="mr-2 h-4 w-4" />
                  Mark Complete
                </>
              )}
            </Button>
          </div>
        )}

        {/* Linked notes (collapsible) */}
        {linkedNotes.length > 0 && (
          <div className="border-t border-border pt-4">
            <button
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setNotesOpen(!notesOpen)}
            >
              {notesOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Linked Notes ({linkedNotes.length})
            </button>
            {notesOpen && (
              <ul className="mt-2 space-y-1 pl-6">
                {linkedNotes.map((link) => (
                  <li
                    key={link.linkedId}
                    className="text-sm text-muted-foreground"
                  >
                    {link.title || link.linkedId}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground/50">
          Press Escape to exit focus mode
        </p>
      </div>
    </div>
  )
}
