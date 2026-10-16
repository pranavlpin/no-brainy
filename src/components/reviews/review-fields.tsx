'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { TaskPicker } from '@/components/planner/task-picker'
import type { ReviewActivity } from '@/lib/types/reviews'
/** A small, optional answer with a stable semantic label. */
export function ReviewAnswer({
  id,
  label,
  value,
  onChange,
  rows = 3,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        maxLength={30000}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-xl border bg-background/70 px-4 py-3 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  )
}
/** Pick one existing action, making the scheduling date explicit before any write. */
export function ReviewAction({
  id,
  date,
  label,
  onChange,
}: {
  id: string | null
  date: string
  label: string
  onChange: (id: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Choosing an action plans it for {date}. Its deadline stays unchanged.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {id && (
          <>
            <Link className="text-sm text-primary underline" href={`/tasks/${id}`}>
              View chosen action
            </Link>
            <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
              Clear selection
            </Button>
          </>
        )}
        <Button variant="outline" onClick={() => setOpen(true)}>
          {label}
        </Button>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title={label}>
        <TaskPicker
          onSelect={(task) => {
            onChange(task.id)
            setOpen(false)
          }}
        />
      </Dialog>
    </div>
  )
}
/** Actual bounded events include partial progress; an empty day is not a score. */
export function ReviewActivityView({ activity }: { activity: ReviewActivity }) {
  return (
    <section className="surface-soft space-y-4 p-5 sm:p-7">
      <div>
        <p className="eyebrow">A few things to notice</p>
        <h2 className="mt-2 text-xl font-semibold">Work and attention</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        {activity.tasksCompleted} completed actions · {Math.round(activity.focusSeconds / 60)}{' '}
        focused minutes · {activity.notesCreated} notes · {activity.cardsReviewed} cards
      </p>
      {!activity.completedTasks.length && !activity.focusSessions.length && (
        <p className="text-sm text-muted-foreground">
          There may be progress this app cannot count. You can write about it below.
        </p>
      )}
      <div className="space-y-2">
        {activity.completedTasks.map((task) => (
          <Link
            className="block text-sm hover:text-primary"
            href={`/tasks/${task.id}`}
            key={task.id}
          >
            ✓ {task.title}
          </Link>
        ))}
        {activity.focusSessions.map((session) => (
          <article
            key={session.id}
            data-testid={`review-session-${session.id}`}
            className="rounded-xl bg-background/70 p-3 text-sm"
          >
            <p className="font-medium">
              {session.taskTitle || session.intention || 'Focused time'}
            </p>
            <p className="mt-1 text-muted-foreground">
              {session.outcome === 'progress'
                ? 'Made progress'
                : session.outcome === 'blocked'
                  ? 'Found a blocker'
                  : 'Completed'}{' '}
              · {Math.round(session.accumulatedSeconds / 60)} min
            </p>
            {session.reflection && <p className="mt-2 whitespace-pre-wrap">{session.reflection}</p>}
          </article>
        ))}
      </div>
    </section>
  )
}
