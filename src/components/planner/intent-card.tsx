'use client'

import { useEffect, useRef, useState } from 'react'
import { Pencil, Quote, Sparkles, Target } from 'lucide-react'
import { Card, CardLabel } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface IntentCardProps {
  intent: string | null
  /** Where the intent came from, e.g. "from last night's review". */
  sourceLabel?: string
  onSave: (intent: string) => void
  onMakeTask?: (intent: string) => void
  /** Hide the "Make it a task" action, e.g. when it already is one. */
  taskCreated?: boolean
  className?: string
}

/**
 * The one line today is about. Seeded from the previous evening's review,
 * editable inline, and promotable to the first focus task.
 */
export function IntentCard({
  intent,
  sourceLabel,
  onSave,
  onMakeTask,
  taskCreated = false,
  className,
}: IntentCardProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(intent ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setDraft(intent ?? '')
  }, [intent, editing])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const commit = () => {
    const next = draft.trim()
    setEditing(false)
    if (next !== (intent ?? '')) onSave(next)
  }

  return (
    <Card
      data-testid="intent-card"
      className={cn('relative overflow-hidden border-retro-pink/30', className)}
    >
      <Quote className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 text-retro-pink/10" />
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-retro-pink/15">
          <Target className="h-4 w-4 text-retro-pink" />
        </span>
        <div className="min-w-0 flex-1">
          <CardLabel>Today&apos;s intent</CardLabel>
          {editing ? (
            <input
              ref={inputRef}
              data-testid="intent-input"
              value={draft}
              maxLength={500}
              placeholder="The one thing that makes today a win…"
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commit()
                }
                if (e.key === 'Escape') {
                  setDraft(intent ?? '')
                  setEditing(false)
                }
              }}
              className="mt-1 w-full border-0 border-b-2 border-retro-pink/40 bg-transparent pb-1 font-display text-lg font-semibold text-retro-dark placeholder:text-retro-dark/30 focus:border-retro-pink focus:outline-none"
            />
          ) : intent ? (
            <p className="mt-1 font-display text-lg font-semibold leading-snug text-retro-dark">
              {intent}
            </p>
          ) : (
            <p className="mt-1 text-sm text-retro-dark/50">
              No intent yet. What would make today a win?
            </p>
          )}
          {sourceLabel && !editing && intent && (
            <p className="mt-1 font-mono text-[11px] text-retro-dark/40">{sourceLabel}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 pl-11">
        <button
          type="button"
          data-testid="intent-edit"
          onClick={() => setEditing(true)}
          className="flex h-8 items-center gap-1.5 rounded-full border border-retro-dark/15 px-3 font-mono text-xs text-retro-dark/70 transition-colors hover:bg-retro-dark/5 hover:text-retro-dark"
        >
          <Pencil className="h-3.5 w-3.5" />
          {intent ? 'Edit' : 'Set intent'}
        </button>
        {intent && onMakeTask && !taskCreated && (
          <button
            type="button"
            data-testid="intent-make-task"
            onClick={() => onMakeTask(intent)}
            className="flex h-8 items-center gap-1.5 rounded-full bg-retro-pink px-3 font-mono text-xs font-bold text-white shadow-hard-pink transition-transform hover:-translate-y-px"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Make it focus #1
          </button>
        )}
      </div>
    </Card>
  )
}
