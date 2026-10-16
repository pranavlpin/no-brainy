'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { ActionComposer } from './action-composer'
/** Turn a chosen application into an owned, sourced action with no AI prerequisite. */
export function BookExperiment({
  bookId,
  title,
  application,
}: {
  bookId: string
  title: string
  application: string
}) {
  const [open, setOpen] = useState(false)
  const [created, setCreated] = useState<string | null>(null)
  return (
    <div
      data-testid={`book-experiment-${bookId}`}
      className="mb-5 rounded-2xl border bg-primary/5 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">
            <FlaskConical className="h-4 w-4 text-primary" />
            Make one idea useful
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose a small experiment, then reflect on what happened.
          </p>
        </div>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Turn into an experiment
        </Button>
      </div>
      {created && (
        <Link
          className="mt-3 inline-flex items-center gap-2 text-sm text-primary"
          href={`/tasks/${created}`}
        >
          Open your experiment
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title="Try one idea">
        <ActionComposer
          source={{ type: 'book', id: bookId, title }}
          initialTitle={`Try one idea from ${title}`.slice(0, 500)}
          initialDescription={application}
          onCreated={(task) => {
            setCreated(task.id)
            setOpen(false)
          }}
        />
      </Dialog>
    </div>
  )
}
