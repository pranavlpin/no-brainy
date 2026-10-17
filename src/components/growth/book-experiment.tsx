'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useCreateTask } from '@/hooks/use-tasks'
import { useGoals } from '@/hooks/use-goals'
import { useUserToday } from '@/hooks/use-user-today'
import { addDays } from '@/lib/dates'
import { cn } from '@/lib/utils'

interface BookExperimentProps {
  bookId: string
  title: string
  /** The book's application note, used as the experiment's description. */
  application: string
}

/**
 * Turn a book's application note into one small, sourced experiment: a task
 * linked to a goal, tagged `experiment`, with the book cited in its text.
 */
export function BookExperiment({ bookId, title, application }: BookExperimentProps) {
  const { today } = useUserToday()
  const createTask = useCreateTask()
  const goals = useGoals({ status: 'active' })
  const [open, setOpen] = useState(false)
  const [experiment, setExperiment] = useState(`Try one idea from ${title}`.slice(0, 500))
  const [goalId, setGoalId] = useState('')
  const [plannedDate, setPlannedDate] = useState('')
  const [minutes, setMinutes] = useState('')
  const [error, setError] = useState('')
  const [created, setCreated] = useState<{ id: string; title: string } | null>(null)
  const lock = useRef(false)
  const tomorrow = addDays(today, 1)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (lock.current || !experiment.trim()) return
    lock.current = true
    setError('')
    try {
      const res = await createTask.mutateAsync({
        title: experiment.trim(),
        descriptionMd: `${application.trim()}\n\nSource: [${title}](/books/${bookId})`,
        tags: ['experiment'],
        goalId: goalId || null,
        plannedDate: plannedDate || null,
        estimatedMinutes: minutes ? Number(minutes) : null,
      })
      setCreated({ id: res.data.id, title: res.data.title })
      setOpen(false)
    } catch {
      setError('Could not create the experiment. Your text is kept; try again.')
    } finally {
      lock.current = false
    }
  }

  return (
    <div data-testid={`book-experiment-${bookId}`} className="surface-glass rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-retro-dark">
            <FlaskConical className="h-4 w-4 text-retro-blue" />
            Make one idea useful
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-retro-dark/60">
            Pick a small experiment from what you wrote above; reflect on it later as evidence.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} disabled={!application.trim()}>
          Turn into an experiment
        </Button>
      </div>
      {created && (
        <Link href={`/tasks/${created.id}`} className="mt-3 inline-flex items-center gap-1 font-mono text-xs text-retro-blue hover:underline">
          Open “{created.title}” <ArrowUpRight className="h-3 w-3" />
        </Link>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="Try one idea" description={`From ${title}.`}>
        <form data-testid="book-experiment-composer" className="space-y-4" onSubmit={(e) => void submit(e)}>
          <p className="rounded-xl bg-retro-yellow/20 px-3 py-2 text-sm text-retro-dark">
            <span className="font-mono text-[11px] uppercase tracking-wide text-retro-dark/50">Source</span>
            <br />
            {title}
          </p>
          <div className="space-y-1">
            <Label htmlFor="experiment-title">Experiment</Label>
            <Input id="experiment-title" required maxLength={500} value={experiment} onChange={(e) => setExperiment(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="experiment-goal">Goal it serves</Label>
            <Select id="experiment-goal" value={goalId} onChange={(e) => setGoalId(e.target.value)}>
              <option value="">No linked goal</option>
              {goals.data?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>When</Label>
              <div className="flex gap-1.5">
                {[
                  ['', 'Someday'],
                  [today, 'Today'],
                  [tomorrow, 'Tomorrow'],
                ].map(([value, label]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setPlannedDate(value)}
                    className={cn(
                      'rounded-full border px-2 py-1 font-mono text-[11px]',
                      plannedDate === value ? 'border-retro-dark bg-retro-dark text-white' : 'border-border'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="experiment-minutes">Minutes</Label>
              <Input id="experiment-minutes" type="number" min={1} max={1440} value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="25" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            The application note becomes the task description with the book cited. No deadline is set.
          </p>
          {error && (
            <p role="alert" className="text-sm text-retro-pink">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={createTask.isPending || !experiment.trim()}>
            {createTask.isPending ? 'Creating…' : 'Create experiment'}
          </Button>
        </form>
      </Dialog>
    </div>
  )
}
