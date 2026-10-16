'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { TaskResponse } from '@/lib/types/tasks'

/** Offer explicit choices for unfinished work while keeping deadlines and history intact. */
export function UnfinishedWork({ tasks, date }: { tasks: TaskResponse[]; date: string }) {
  const update = useUpdateTask()
  const create = useCreateTask()
  const [choice, setChoice] = useState<{
    task: TaskResponse
    kind: 'reschedule' | 'split' | 'drop'
  } | null>(null)
  const [nextDate, setNextDate] = useState(date)
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const lock = useRef(false)
  const save = async (task: TaskResponse, plannedDate: string) => {
    if (lock.current) return
    lock.current = true
    setPending(true)
    setError('')
    try {
      await update.mutateAsync({ id: task.id, data: { plannedDate } })
      setChoice(null)
      setMessage(`Planned for ${plannedDate}. Deadline unchanged.`)
    } catch {
      setError('Could not reschedule this action. Please retry.')
    } finally {
      lock.current = false
      setPending(false)
    }
  }
  return (
    <section className="space-y-4" aria-labelledby="unfinished-heading">
      <div>
        <p className="eyebrow">Close the loops gently</p>
        <h2 id="unfinished-heading" className="mt-2 text-xl font-semibold">
          Earlier unfinished work
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Continue, make it smaller, choose another day, or let it go.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-primary">
          {message}
        </p>
      )}
      {tasks.map((task) => (
        <article key={task.id} data-testid={`carry-forward-${task.id}`} className="surface p-4">
          <Link className="font-medium hover:text-primary" href={`/tasks/${task.id}`}>
            {task.title}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {task.plannedDate ? `Previously planned ${task.plannedDate}` : 'From an earlier plan'}
            {task.dueDate ? ` · Deadline ${task.dueDate.slice(0, 10)}` : ''}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void save(task, date)}
            >
              Continue today
            </Button>
            {(['reschedule', 'split', 'drop'] as const).map((kind) => (
              <Button
                key={kind}
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => {
                  setChoice({ task, kind })
                  setNextDate(date)
                  setTitle('')
                  setError('')
                }}
              >
                {kind === 'reschedule'
                  ? 'Choose another day'
                  : kind === 'split'
                    ? 'Make it smaller'
                    : 'Drop'}
              </Button>
            ))}
          </div>
        </article>
      ))}
      {!tasks.length && (
        <p className="rounded-2xl bg-muted/50 p-5 text-sm text-muted-foreground">
          Nothing waiting from an earlier plan.
        </p>
      )}
      <Dialog
        open={!!choice}
        onClose={() => {
          if (!pending) setChoice(null)
        }}
        title={
          choice?.kind === 'drop'
            ? 'Let this action go?'
            : choice?.kind === 'split'
              ? 'Find a smaller next step'
              : 'Choose a day'
        }
        description={
          choice?.kind === 'drop'
            ? 'This action will be marked cancelled. Its history stays available.'
            : 'Your original deadline stays unchanged.'
        }
      >
        {choice && (
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault()
              if (choice.kind === 'reschedule') {
                await save(choice.task, nextDate)
                return
              }
              if (lock.current) return
              lock.current = true
              setPending(true)
              setError('')
              try {
                if (choice.kind === 'drop')
                  await update.mutateAsync({ id: choice.task.id, data: { status: 'cancelled' } })
                else
                  await create.mutateAsync({
                    title,
                    parentTaskId: choice.task.id,
                    projectId: choice.task.projectId,
                    goalId: choice.task.goalId ?? undefined,
                    context: choice.task.context,
                    plannedDate: nextDate,
                    priority: choice.task.priority,
                  })
                setMessage(
                  choice.kind === 'drop'
                    ? 'Action cancelled. Its history is kept.'
                    : 'Smaller next step created and planned. The original action is kept.'
                )
                setChoice(null)
              } catch {
                setError('Could not save this change. Your entries are kept; please retry.')
              } finally {
                lock.current = false
                setPending(false)
              }
            }}
          >
            <p className="text-sm font-medium">{choice.task.title}</p>
            {choice.kind === 'split' && (
              <div className="space-y-2">
                <label htmlFor="smaller-step" className="text-sm">
                  Next step
                </label>
                <Input
                  id="smaller-step"
                  value={title}
                  required
                  maxLength={500}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="What is the smallest useful action?"
                />
              </div>
            )}
            {choice.kind !== 'drop' && (
              <div className="space-y-2">
                <label htmlFor="reschedule-date" className="text-sm">
                  Planned day
                </label>
                <Input
                  id="reschedule-date"
                  type="date"
                  required
                  value={nextDate}
                  onChange={(event) => setNextDate(event.target.value)}
                />
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={pending}
              variant={choice.kind === 'drop' ? 'destructive' : 'default'}
            >
              {pending ? 'Saving…' : choice.kind === 'drop' ? 'Drop action' : 'Save choice'}
            </Button>
          </form>
        )}
      </Dialog>
    </section>
  )
}
