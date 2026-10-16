'use client'
import { useRef, useState } from 'react'
import { useCreateGrowthAction } from '@/hooks/use-growth'
import { useGoals } from '@/hooks/use-goals'
import { useTodayPlan } from '@/hooks/use-planner'
import type { GrowthActionInput } from '@/lib/types/growth'
import type { TaskResponse } from '@/lib/types/tasks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
/** Create a deliberate, retry-safe next action with optional scheduling and a learning source. */
export function ActionComposer({
  goalId,
  source,
  initialTitle = '',
  initialDescription = '',
  onCreated,
}: {
  goalId?: string
  source?: { type: 'book' | 'note'; id: string; title: string }
  initialTitle?: string
  initialDescription?: string
  onCreated: (task: TaskResponse) => void
}) {
  const create = useCreateGrowthAction()
  const goals = useGoals({ status: 'active' })
  const today = useTodayPlan()
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [selectedGoal, setGoal] = useState(goalId ?? '')
  const [plannedDate, setDate] = useState('')
  const [minutes, setMinutes] = useState('')
  const [rule, setRule] = useState<GrowthActionInput['rrule']>(null)
  const [error, setError] = useState('')
  const [requestId] = useState(() => crypto.randomUUID())
  const lock = useRef(false)
  return (
    <form
      className="space-y-4"
      data-testid="goal-next-action"
      onSubmit={async (event) => {
        event.preventDefault()
        if (lock.current) return
        lock.current = true
        setError('')
        try {
          const task = await create.mutateAsync({
            clientRequestId: requestId,
            title,
            description,
            goalId: selectedGoal || null,
            plannedDate: plannedDate || null,
            estimatedMinutes: minutes ? Number(minutes) : null,
            rrule: rule,
            sourceType: source?.type,
            sourceId: source?.id,
          })
          onCreated(task)
        } catch (e) {
          setError(
            (e as { error?: { message?: string } })?.error?.message ??
              'Could not create this action. Your input is kept; please retry.'
          )
        } finally {
          lock.current = false
        }
      }}
    >
      {source && (
        <p className="rounded-xl bg-primary/5 p-3 text-sm text-primary">
          Learning source: {source.title}
        </p>
      )}
      <div>
        <label htmlFor="growth-action-title" className="mb-1 block text-sm">
          Next action title
        </label>
        <Input
          id="growth-action-title"
          required
          maxLength={500}
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="One step you can actually start"
        />
      </div>
      <div>
        <label htmlFor="growth-action-notes" className="mb-1 block text-sm">
          How will you try it? (optional)
        </label>
        <textarea
          id="growth-action-notes"
          className="min-h-20 w-full rounded-xl border bg-background p-3 text-sm"
          maxLength={10000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      {!goalId && (
        <div>
          <label htmlFor="growth-action-goal" className="mb-1 block text-sm">
            Growth goal (optional)
          </label>
          <Select
            id="growth-action-goal"
            value={selectedGoal}
            onChange={(e) => setGoal(e.target.value)}
          >
            <option value="">No linked goal</option>
            {goals.data?.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </Select>
          {goals.isError && (
            <p role="alert" className="text-xs">
              Could not load goals.{' '}
              <button type="button" className="underline" onClick={() => goals.refetch()}>
                Retry
              </button>
            </p>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="growth-action-day" className="mb-1 block text-sm">
            Planned day (optional)
          </label>
          <Input
            id="growth-action-day"
            type="date"
            value={plannedDate}
            onChange={(e) => setDate(e.target.value)}
          />
          <Button
            type="button"
            variant="link"
            size="sm"
            disabled={!today.data || today.isFetching}
            onClick={() => {
              if (today.data) setDate(today.data.planDate)
            }}
          >
            Plan for Today
          </Button>
        </div>
        <div>
          <label htmlFor="growth-action-estimate" className="mb-1 block text-sm">
            Estimated minutes
          </label>
          <Input
            id="growth-action-estimate"
            type="number"
            min="1"
            max="1440"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label htmlFor="growth-action-rule" className="mb-1 block text-sm">
          Practice rhythm
        </label>
        <Select
          id="growth-action-rule"
          value={rule ?? ''}
          onChange={(e) => setRule((e.target.value || null) as GrowthActionInput['rrule'])}
        >
          <option value="">One small experiment</option>
          <option value="FREQ=DAILY">Daily routine</option>
          <option value="FREQ=WEEKLY">Weekly routine</option>
          <option value="FREQ=MONTHLY">Monthly routine</option>
        </Select>
        <p className="mt-2 text-xs text-muted-foreground">
          Scheduling is your choice. This does not set a deadline.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button className="w-full" type="submit" disabled={create.isPending || !title.trim()}>
        {create.isPending ? 'Creating…' : 'Create action'}
      </Button>
    </form>
  )
}
