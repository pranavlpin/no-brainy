'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { GoalResponse, GoalStatus } from '@/lib/types/goals'

const CATEGORIES = ['fitness', 'learning', 'work', 'personal']
const STATUSES: GoalStatus[] = ['active', 'completed', 'paused', 'abandoned']

interface GoalFormProps {
  goal?: GoalResponse
  onSubmit: (data: {
    title: string
    description?: string
    category?: string
    targetDate?: string
    status?: GoalStatus
  }) => void
  onCancel: () => void
  isLoading?: boolean
}

export function GoalForm({ goal, onSubmit, onCancel, isLoading }: GoalFormProps) {
  const [title, setTitle] = useState(goal?.title ?? '')
  const [description, setDescription] = useState(goal?.description ?? '')
  const [category, setCategory] = useState(goal?.category ?? '')
  const [targetDate, setTargetDate] = useState(
    goal?.targetDate ? goal.targetDate.slice(0, 10) : ''
  )
  const [status, setStatus] = useState<GoalStatus>(goal?.status ?? 'active')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category: category || undefined,
      targetDate: targetDate || undefined,
      status,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="goal-title">Title</Label>
        <Input
          id="goal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Run a marathon"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal-description">Description</Label>
        <textarea
          id="goal-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What do you want to achieve?"
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="goal-category">Category</Label>
          <Select
            id="goal-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">None</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="goal-status">Status</Label>
          <Select
            id="goal-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as GoalStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal-target-date">Target Date</Label>
        <Input
          id="goal-target-date"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!title.trim() || isLoading}>
          {isLoading ? 'Saving...' : goal ? 'Update Goal' : 'Create Goal'}
        </Button>
      </div>
    </form>
  )
}
