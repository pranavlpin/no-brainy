'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useExpenseCategories } from '@/hooks/use-expense-categories'
import type { GoalResponse, GoalStatus } from '@/lib/types/goals'

const CATEGORIES = ['fitness', 'learning', 'work', 'personal', 'financial']
const STATUSES: GoalStatus[] = ['active', 'completed', 'paused', 'abandoned']

interface GoalFormProps {
  goal?: GoalResponse
  onSubmit: (data: {
    title: string
    description?: string
    category?: string
    targetDate?: string
    startDate?: string
    expenseCategoryId?: string
    expenseTag?: string
    targetAmount?: number
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
  const [startDate, setStartDate] = useState(
    goal?.startDate ? goal.startDate.slice(0, 10) : ''
  )
  const [status, setStatus] = useState<GoalStatus>(goal?.status ?? 'active')
  const [targetAmount, setTargetAmount] = useState(
    goal?.targetAmount ? String(goal.targetAmount) : ''
  )
  const [trackBy, setTrackBy] = useState<'category' | 'tag'>(
    goal?.expenseTag ? 'tag' : 'category'
  )
  const [expenseCategoryId, setExpenseCategoryId] = useState(
    goal?.expenseCategoryId ?? ''
  )
  const [expenseTag, setExpenseTag] = useState(goal?.expenseTag ?? '')

  const { data: expenseCategories } = useExpenseCategories()

  const isFinancial = category === 'financial'

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault()
    const data: Parameters<typeof onSubmit>[0] = {
      title: title.trim(),
      description: description.trim() || undefined,
      category: category || undefined,
      targetDate: targetDate || undefined,
      status,
    }

    if (isFinancial) {
      data.startDate = startDate || undefined
      data.targetAmount = targetAmount ? Number(targetAmount) : undefined
      if (trackBy === 'category' && expenseCategoryId) {
        data.expenseCategoryId = expenseCategoryId
      } else if (trackBy === 'tag' && expenseTag.trim()) {
        data.expenseTag = expenseTag.trim()
      }
    }

    onSubmit(data)
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

      {isFinancial && (
        <div className="space-y-4 rounded-md border-2 border-dashed border-yellow-400/60 p-4 bg-yellow-50/30 dark:bg-yellow-950/10">
          <p className="font-mono text-xs font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">
            Financial Goal Settings
          </p>

          <div className="space-y-2">
            <Label htmlFor="goal-target-amount" className="font-mono text-xs">
              Target Amount (INR)
            </Label>
            <Input
              id="goal-target-amount"
              type="number"
              min="1"
              step="1"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="e.g. 50000"
              className="border-2"
              required={isFinancial}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal-start-date" className="font-mono text-xs">
                Start Date
              </Label>
              <Input
                id="goal-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-2"
                required={isFinancial}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-end-date" className="font-mono text-xs">
                End Date
              </Label>
              <Input
                id="goal-end-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="border-2"
                required={isFinancial}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-xs">Track By</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={trackBy === 'category' ? 'default' : 'outline'}
                onClick={() => setTrackBy('category')}
                className="font-mono text-xs"
              >
                Category
              </Button>
              <Button
                type="button"
                size="sm"
                variant={trackBy === 'tag' ? 'default' : 'outline'}
                onClick={() => setTrackBy('tag')}
                className="font-mono text-xs"
              >
                Tag
              </Button>
            </div>
          </div>

          {trackBy === 'category' ? (
            <div className="space-y-2">
              <Label htmlFor="goal-expense-category" className="font-mono text-xs">
                Expense Category
              </Label>
              <Select
                id="goal-expense-category"
                value={expenseCategoryId}
                onChange={(e) => setExpenseCategoryId(e.target.value)}
                className="border-2"
              >
                <option value="">Select category...</option>
                {expenseCategories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="goal-expense-tag" className="font-mono text-xs">
                Expense Tag
              </Label>
              <Input
                id="goal-expense-tag"
                value={expenseTag}
                onChange={(e) => setExpenseTag(e.target.value)}
                placeholder="e.g. groceries"
                className="border-2"
              />
            </div>
          )}
        </div>
      )}

      {!isFinancial && (
        <div className="space-y-2">
          <Label htmlFor="goal-target-date">Target Date</Label>
          <Input
            id="goal-target-date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>
      )}

      {!goal && !isFinancial && (
        <p className="text-xs text-muted-foreground">
          You can optionally link tasks to this goal after creating it.
        </p>
      )}

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
