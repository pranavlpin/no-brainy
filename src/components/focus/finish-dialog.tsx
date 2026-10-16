'use client'

import { useState } from 'react'
import { CheckCircle2, Footprints, OctagonAlert } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatMinutes } from '@/lib/planner/capacity'
import { cn } from '@/lib/utils'
import type { FinishSessionInput, FocusOutcome } from '@/lib/types/focus'

interface FinishDialogProps {
  open: boolean
  taskTitle?: string | null
  intention?: string
  elapsedSec: number
  isSaving: boolean
  error?: string | null
  onFinish: (input: FinishSessionInput) => void
  onClose: () => void
}

const OUTCOMES: {
  value: FocusOutcome
  label: string
  hint: string
  icon: typeof CheckCircle2
  tone: string
}[] = [
  {
    value: 'completed',
    label: 'Completed',
    hint: 'The task is done. It gets checked off.',
    icon: CheckCircle2,
    tone: 'border-retro-mint/60 bg-retro-mint/15 hover:bg-retro-mint/30',
  },
  {
    value: 'progress',
    label: 'Made progress',
    hint: 'Moved it forward. Stays open.',
    icon: Footprints,
    tone: 'border-retro-blue/40 bg-retro-blue/10 hover:bg-retro-blue/20',
  },
  {
    value: 'blocked',
    label: 'Blocked',
    hint: 'Something is in the way. Stays open.',
    icon: OctagonAlert,
    tone: 'border-retro-orange/50 bg-retro-orange/10 hover:bg-retro-orange/25',
  },
]

/**
 * The end of a focus block asks one honest question: what happened? Only
 * Completed finishes the task. A next action becomes an undated task so
 * the thread is not lost.
 */
export function FinishDialog({
  open,
  taskTitle,
  intention,
  elapsedSec,
  isSaving,
  error,
  onFinish,
  onClose,
}: FinishDialogProps) {
  const [reflection, setReflection] = useState('')
  const [nextAction, setNextAction] = useState('')

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="How did it go?"
      description={
        taskTitle
          ? `${formatMinutes(elapsedSec / 60)} on "${taskTitle}".`
          : `${formatMinutes(elapsedSec / 60)} of focus.`
      }
      size="lg"
    >
      <div data-testid="focus-finish" className="space-y-4">
        {intention && (
          <p className="rounded-xl bg-retro-yellow/20 px-3 py-2 text-sm text-retro-dark">
            <span className="font-mono text-[11px] uppercase tracking-wide text-retro-dark/50">
              You set out to
            </span>
            <br />
            {intention}
          </p>
        )}

        <div className="space-y-1">
          <Label htmlFor="focus-reflection">What happened?</Label>
          <textarea
            id="focus-reflection"
            data-testid="focus-result"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={2}
            placeholder="One or two lines. Future you will read this."
            disabled={isSaving}
            className="w-full resize-y rounded-xl border border-border/80 bg-background/70 px-3 py-2 text-sm text-retro-dark placeholder:text-retro-dark/30 focus:border-retro-blue focus:outline-none focus:ring-2 focus:ring-retro-blue/30"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="focus-next-action">Next action (optional)</Label>
          <Input
            id="focus-next-action"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="The very next physical step"
            disabled={isSaving}
          />
          <p className="text-[11px] text-muted-foreground">
            Becomes an undated task on the same goal.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label="Outcome">
          {OUTCOMES.map((o) => (
            <button
              key={o.value}
              type="button"
              data-testid={`focus-outcome-${o.value}`}
              disabled={isSaving}
              onClick={() => onFinish({ outcome: o.value, reflection, nextAction })}
              className={cn(
                'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors disabled:opacity-50',
                o.tone
              )}
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold text-retro-dark">
                <o.icon className="h-4 w-4" />
                {o.label}
              </span>
              <span className="font-mono text-[10px] text-retro-dark/60">{o.hint}</span>
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="text-sm text-retro-pink">
            {error} Your notes stay here; try again.
          </p>
        )}
      </div>
    </Dialog>
  )
}
