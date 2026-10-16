'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ReviewAnswer } from '@/components/reviews/review-fields'
import type { DailyPlanSuggestion } from '@/lib/ai/types'
import type { TaskResponse } from '@/lib/types/tasks'
/** Editable, explicit planning preview. Missing relationships never become invisible accepted IDs. */
export function AISuggestPanel({
  suggestion,
  allTasks,
  onAccept,
  onDismiss,
}: {
  suggestion: DailyPlanSuggestion
  allTasks: TaskResponse[]
  onAccept: (ids: string[], brief: string) => void
  onDismiss: () => void
}) {
  const [ids, setIds] = useState(suggestion.suggestedTaskIds),
    [brief, setBrief] = useState(suggestion.briefMd)
  const missing = suggestion.suggestedTaskIds.some(
    (id) => !allTasks.some((t) => t.id === id && ['pending', 'in_progress'].includes(t.status))
  )
  const invalid =
    suggestion.suggestedTaskIds.length > 3 ||
    new Set(suggestion.suggestedTaskIds).size !== suggestion.suggestedTaskIds.length
  return (
    <section className="surface-soft space-y-5 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">A possible plan</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          aria-label="Close planning suggestion"
        >
          Close
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {suggestion.planDate ? `For ${suggestion.planDate}. ` : ''}Nothing changes until you accept.
        Uncheck an action or edit the brief.
      </p>
      <ReviewAnswer
        id="ai-planning-brief"
        label="Edit planning brief"
        value={brief}
        onChange={setBrief}
      />
      {(missing || invalid) && (
        <p role="alert" className="text-sm text-destructive">
          Some suggested actions are no longer available. Dismiss and generate a new suggestion.
        </p>
      )}
      <div className="space-y-3">
        {suggestion.suggestedTaskIds.map((id) => {
          const task = allTasks.find((t) => t.id === id)
          if (!task) return null
          return (
            <article key={id} className="rounded-xl border bg-background/70 p-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={ids.includes(id)}
                  aria-label={`Plan ${task.title}`}
                  onChange={(event) =>
                    setIds(
                      event.target.checked ? [...ids, id] : ids.filter((value) => value !== id)
                    )
                  }
                />
                <span className="text-sm font-medium">{task.title}</span>
              </label>
              <div className="ml-6 mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>
                  {task.estimatedMinutes ? `${task.estimatedMinutes} min` : 'No estimate yet'}
                </span>
                {task.dueDate && <span>Deadline {task.dueDate.slice(0, 10)}</span>}
                <Link href={`/tasks/${task.id}`} className="text-primary underline">
                  View source action
                </Link>
              </div>
            </article>
          )
        })}
      </div>
      {suggestion.warnings?.map((warning) => (
        <p key={warning} className="text-sm text-amber-700 dark:text-amber-300">
          {warning}
        </p>
      ))}
      <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={missing || invalid || !ids.length || !brief.trim()}
          onClick={() => onAccept(ids, brief)}
        >
          Accept Suggestions
        </Button>
        <Button size="sm" variant="outline" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </section>
  )
}
