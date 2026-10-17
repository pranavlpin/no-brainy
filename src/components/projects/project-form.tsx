'use client'

import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useGoals } from '@/hooks/use-goals'
import type { ProjectContext, ProjectInput } from '@/lib/types/projects'

interface ProjectFormProps {
  initial?: Partial<ProjectInput>
  onSave: (data: ProjectInput) => Promise<unknown>
  label?: string
}

/** Outcome-first project form; entries stay put when saving fails. */
export function ProjectForm({ initial, onSave, label = 'Create project' }: ProjectFormProps) {
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
  const goals = useGoals({ status: 'active' })

  return (
    <form
      className="space-y-4"
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
      <div className="space-y-1">
        <Label htmlFor={`${id}-title`}>Project name</Label>
        <Input
          id={`${id}-title`}
          required
          maxLength={200}
          autoFocus
          value={value.title}
          onChange={(e) => setValue({ ...value, title: e.target.value })}
          placeholder="A calmer launch, a stronger routine…"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${id}-outcome`}>What does done look like?</Label>
        <textarea
          id={`${id}-outcome`}
          className="min-h-24 w-full resize-y rounded-xl border border-border/80 bg-background/70 px-3 py-2 text-sm text-retro-dark placeholder:text-retro-dark/30 focus:border-retro-blue focus:outline-none focus:ring-2 focus:ring-retro-blue/30"
          maxLength={5000}
          value={value.outcome ?? ''}
          onChange={(e) => setValue({ ...value, outcome: e.target.value })}
          placeholder="A concrete outcome you would recognise."
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`${id}-context`}>Context</Label>
          <Select
            id={`${id}-context`}
            value={value.context ?? 'personal'}
            onChange={(e) => setValue({ ...value, context: e.target.value as ProjectContext })}
          >
            <option value="personal">Personal</option>
            <option value="work">Work</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${id}-goal`}>Goal it serves</Label>
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
        <p role="alert" className="text-sm text-retro-pink">
          Goals could not load.{' '}
          <button type="button" className="underline" onClick={() => void goals.refetch()}>
            Retry
          </button>
        </p>
      )}
      {failed && (
        <p role="alert" className="text-sm text-retro-pink">
          Could not save this project. Your entries are kept; try again.
        </p>
      )}
      <Button type="submit" disabled={pending || !value.title.trim()} className="w-full">
        {pending ? 'Saving…' : label}
      </Button>
    </form>
  )
}
