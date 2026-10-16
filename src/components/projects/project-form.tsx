'use client'

import { useId, useRef, useState } from 'react'
import { useGoals } from '@/hooks/use-goals'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { ProjectInput } from '@/lib/types/projects'

/** A small outcome-first form that retains entries when saving fails. */
export function ProjectForm({
  initial,
  onSave,
  label = 'Create project',
}: {
  initial?: ProjectInput
  onSave: (data: ProjectInput) => Promise<unknown>
  label?: string
}) {
  const id = useId()
  const [value, setValue] = useState<ProjectInput>({
    title: '',
    outcome: '',
    context: 'personal',
    goalId: null,
    ...initial,
  })
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const lock = useRef(false)
  const goals = useGoals()
  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        if (lock.current || !value.title.trim()) return
        lock.current = true
        setPending(true)
        setFailed(false)
        try {
          await onSave({ ...value, title: value.title.trim() })
        } catch {
          setFailed(true)
        } finally {
          lock.current = false
          setPending(false)
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor={`${id}-title`}>Project name</Label>
        <Input
          id={`${id}-title`}
          required
          maxLength={200}
          value={value.title}
          onChange={(e) => setValue({ ...value, title: e.target.value })}
          placeholder="A calmer launch, a stronger routine…"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-outcome`}>What does done look like?</Label>
        <textarea
          id={`${id}-outcome`}
          className="min-h-28 w-full rounded-xl border bg-background p-3 text-sm focus-visible:outline-ring"
          maxLength={5000}
          value={value.outcome}
          onChange={(e) => setValue({ ...value, outcome: e.target.value })}
          placeholder="A concrete outcome you can recognise."
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${id}-context`}>Project context</Label>
          <Select
            id={`${id}-context`}
            value={value.context}
            onChange={(e) => setValue({ ...value, context: e.target.value as 'work' | 'personal' })}
          >
            <option value="personal">Personal</option>
            <option value="work">Work</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-goal`}>Linked growth goal</Label>
          <Select
            id={`${id}-goal`}
            value={value.goalId ?? ''}
            onChange={(e) => setValue({ ...value, goalId: e.target.value || null })}
          >
            <option value="">No linked goal</option>
            {goals.data?.map((goal) => (
              <option value={goal.id} key={goal.id}>
                {goal.title}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {goals.isError && (
        <p role="alert" className="text-sm text-destructive">
          Goals could not load.{' '}
          <button type="button" className="underline" onClick={() => void goals.refetch()}>
            Retry goals
          </button>
        </p>
      )}
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          Could not save this project. Your entries are kept. Try again; if it changed elsewhere,
          close and reopen the form.
        </p>
      )}
      <Button type="submit" disabled={pending || !value.title.trim()} className="w-full">
        {pending ? 'Saving…' : label}
      </Button>
    </form>
  )
}
