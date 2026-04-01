'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { HabitResponse, HabitFrequency } from '@/lib/types/goals'
import type { GoalResponse } from '@/lib/types/goals'

const FREQUENCIES: { value: HabitFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

interface HabitFormProps {
  habit?: HabitResponse
  goals?: GoalResponse[]
  onSubmit: (data: {
    title: string
    frequency: HabitFrequency
    goalId?: string
  }) => void
  onCancel: () => void
  isLoading?: boolean
}

export function HabitForm({ habit, goals, onSubmit, onCancel, isLoading }: HabitFormProps) {
  const [title, setTitle] = useState(habit?.title ?? '')
  const [frequency, setFrequency] = useState<HabitFrequency>(habit?.frequency ?? 'daily')
  const [goalId, setGoalId] = useState(habit?.goalId ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      title: title.trim(),
      frequency,
      goalId: goalId || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="habit-title">Title</Label>
        <Input
          id="habit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Morning run"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="habit-frequency">Frequency</Label>
        <Select
          id="habit-frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
        >
          {FREQUENCIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
      </div>

      {goals && goals.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="habit-goal">Linked Goal (optional)</Label>
          <Select
            id="habit-goal"
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
          >
            <option value="">None</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!title.trim() || isLoading}>
          {isLoading ? 'Saving...' : habit ? 'Update Habit' : 'Create Habit'}
        </Button>
      </div>
    </form>
  )
}
