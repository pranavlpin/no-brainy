'use client'

import { useId } from 'react'
import { useProjects } from '@/hooks/use-projects'
import { useGoals } from '@/hooks/use-goals'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { UpdateTaskRequest } from '@/lib/types/tasks'

/** Optional planning fields distinguish intention, deadline and growth linkage. */
export function TaskPlanningFields({
  value,
  onChange,
}: {
  value: UpdateTaskRequest
  onChange: (patch: UpdateTaskRequest) => void
}) {
  const id = useId()
  const { data: projects = [], isError: projectsError } = useProjects({ status: 'all' })
  const { data: goals = [], isError: goalsError } = useGoals()
  return (
    <div className="grid gap-4 sm:grid-cols-2" data-testid="task-planning-fields">
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-project`}>Project</Label>
        <Select
          id={`${id}-project`}
          value={value.projectId ?? ''}
          onChange={(event) => onChange({ projectId: event.target.value || null })}
        >
          <option value="">No project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
              {project.status === 'archived' ? ' (archived)' : ''}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-goal`}>Growth goal</Label>
        <Select
          id={`${id}-goal`}
          value={value.goalId ?? ''}
          onChange={(event) => onChange({ goalId: event.target.value || null })}
        >
          <option value="">No linked goal</option>
          {goals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.title}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-planned`}>Planned day</Label>
        <Input
          id={`${id}-planned`}
          type="date"
          value={value.plannedDate?.slice(0, 10) ?? ''}
          onChange={(event) => onChange({ plannedDate: event.target.value || null })}
        />
        <p className="text-xs text-muted-foreground">
          When you intend to work on it. Your deadline stays separate.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-estimate`}>Estimated minutes</Label>
        <Input
          id={`${id}-estimate`}
          type="number"
          min={1}
          max={1440}
          value={value.estimatedMinutes ?? ''}
          placeholder="e.g. 30"
          onChange={(event) =>
            onChange({ estimatedMinutes: event.target.value ? Number(event.target.value) : null })
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-effort`}>Energy needed</Label>
        <Select
          id={`${id}-effort`}
          value={value.effort ?? ''}
          onChange={(event) =>
            onChange({ effort: (event.target.value as UpdateTaskRequest['effort']) || null })
          }
        >
          <option value="">Unspecified</option>
          <option value="light">Light — small effort</option>
          <option value="steady">Steady — some attention</option>
          <option value="deep">Deep — focused thinking</option>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-context`}>Context</Label>
        <Select
          id={`${id}-context`}
          value={value.context ?? ''}
          onChange={(event) =>
            onChange({ context: (event.target.value as UpdateTaskRequest['context']) || null })
          }
        >
          <option value="">Unclassified</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
        </Select>
      </div>
      {(projectsError || goalsError) && (
        <p role="alert" className="text-xs text-destructive sm:col-span-2">
          Could not load all linking options. Your task can still be saved; reopen this section to
          try again.
        </p>
      )}
    </div>
  )
}
