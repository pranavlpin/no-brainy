'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { TaskContext, TaskEffort } from '@/lib/types/tasks'

export interface PlanningValues {
  plannedDate: string | null
  estimatedMinutes: number | null
  effort: TaskEffort | null
  context: TaskContext | null
}

interface TaskPlanningFieldsProps {
  value: PlanningValues
  onChange: (patch: Partial<PlanningValues>) => void
  idPrefix?: string
  className?: string
}

export const EFFORT_OPTIONS: { value: TaskEffort; label: string; hint: string }[] = [
  { value: 'light', label: 'Light', hint: 'Can be done between things' },
  { value: 'steady', label: 'Steady', hint: 'Needs attention, not silence' },
  { value: 'deep', label: 'Deep', hint: 'Needs a protected block' },
]

export const ESTIMATE_PRESETS = [15, 30, 45, 60, 90, 120]

export function formatEstimate(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

/**
 * Planning metadata shared by the create form and the detail page:
 * when you intend to do it, how long it takes, how heavy it is, and
 * whether it belongs to work or personal life.
 */
export function TaskPlanningFields({
  value,
  onChange,
  idPrefix = 'plan',
  className,
}: TaskPlanningFieldsProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-planned`}>Planned for</Label>
        <Input
          id={`${idPrefix}-planned`}
          type="date"
          value={value.plannedDate ?? ''}
          onChange={(e) => onChange({ plannedDate: e.target.value || null })}
        />
        <p className="text-[11px] text-muted-foreground">
          The day you will work on it, not the deadline.
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-estimate`}>Estimate</Label>
        <div className="flex items-center gap-2">
          <Input
            id={`${idPrefix}-estimate`}
            type="number"
            min={1}
            max={1440}
            inputMode="numeric"
            placeholder="min"
            className="w-24"
            value={value.estimatedMinutes ?? ''}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10)
              onChange({ estimatedMinutes: Number.isFinite(n) && n > 0 ? Math.min(n, 1440) : null })
            }}
          />
          <div className="flex flex-wrap gap-1" role="group" aria-label="Estimate presets">
            {ESTIMATE_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={value.estimatedMinutes === m}
                onClick={() =>
                  onChange({ estimatedMinutes: value.estimatedMinutes === m ? null : m })
                }
                className={cn(
                  'rounded-full border px-2 py-0.5 font-mono text-[11px] transition-colors',
                  value.estimatedMinutes === m
                    ? 'border-retro-dark bg-retro-dark text-white'
                    : 'border-border text-muted-foreground hover:border-retro-dark/40 hover:text-foreground'
                )}
              >
                {formatEstimate(m)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Effort</Label>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Effort">
          {EFFORT_OPTIONS.map((opt) => {
            const active = value.effort === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                title={opt.hint}
                onClick={() => onChange({ effort: active ? null : opt.value })}
                className={cn(
                  'rounded-md border px-2 py-1.5 text-left text-xs transition-colors',
                  active
                    ? 'border-retro-dark bg-retro-yellow/40 font-semibold'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-context`}>Context</Label>
        <Select
          id={`${idPrefix}-context`}
          value={value.context ?? ''}
          onChange={(e) => onChange({ context: (e.target.value || null) as TaskContext | null })}
        >
          <option value="">Either</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
        </Select>
      </div>
    </div>
  )
}
