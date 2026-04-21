'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { GoalCard } from '@/components/goals/goal-card'
import { GoalForm } from '@/components/goals/goal-form'
import { useGoals, useCreateGoal, type GoalFilters } from '@/hooks/use-goals'
import type { GoalStatus } from '@/lib/types/goals'

const CATEGORIES = ['', 'fitness', 'learning', 'work', 'personal']
const STATUSES: Array<GoalStatus | ''> = ['', 'active', 'completed', 'paused', 'abandoned']

export default function GoalsPage(): React.ReactElement {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<GoalStatus | ''>('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showGoalForm, setShowGoalForm] = useState(false)

  const filters: GoalFilters = {}
  if (statusFilter) filters.status = statusFilter
  if (categoryFilter) filters.category = categoryFilter

  const { data: goals, isLoading } = useGoals(filters)
  const createGoal = useCreateGoal()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold text-retro-dark">Goals</h1>
        </div>
        <Button size="sm" onClick={() => setShowGoalForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Goal
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select
          className="w-36"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as GoalStatus | '')}
        >
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {(s as string).charAt(0).toUpperCase() + (s as string).slice(1)}
            </option>
          ))}
        </Select>
        <Select
          className="w-36"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.filter(Boolean).map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : goals && goals.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onClick={() => router.push(`/goals/${goal.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-retro-dark/20 py-16 text-center">
          <Target className="h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 font-mono text-sm text-muted-foreground">
            No goals yet. Create your first goal to get started!
          </p>
        </div>
      )}

      {/* New Goal Dialog */}
      <Dialog
        open={showGoalForm}
        onClose={() => setShowGoalForm(false)}
        title="New Goal"
      >
        <GoalForm
          onSubmit={(data) => {
            createGoal.mutate(data, {
              onSuccess: () => setShowGoalForm(false),
            })
          }}
          onCancel={() => setShowGoalForm(false)}
          isLoading={createGoal.isPending}
        />
      </Dialog>
    </div>
  )
}
