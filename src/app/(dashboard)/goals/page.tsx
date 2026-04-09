'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Target, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { GoalCard } from '@/components/goals/goal-card'
import { GoalForm } from '@/components/goals/goal-form'
import { HabitList } from '@/components/habits/habit-list'
import { HabitForm } from '@/components/habits/habit-form'
import { useGoals, useCreateGoal, useHabits, useCreateHabit, type GoalFilters } from '@/hooks/use-goals'
import type { GoalStatus } from '@/lib/types/goals'

const CATEGORIES = ['', 'fitness', 'learning', 'work', 'personal']
const STATUSES: Array<GoalStatus | ''> = ['', 'active', 'completed', 'paused', 'abandoned']

export default function GoalsPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<GoalStatus | ''>('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showHabitForm, setShowHabitForm] = useState(false)

  const filters: GoalFilters = {}
  if (statusFilter) filters.status = statusFilter
  if (categoryFilter) filters.category = categoryFilter

  const { data: goals, isLoading: goalsLoading } = useGoals(filters)
  const { data: habits, isLoading: habitsLoading } = useHabits()
  const createGoal = useCreateGoal()
  const createHabit = useCreateHabit()

  // Build today's logs lookup from habits data
  const todayLogs: Record<string, boolean> = useMemo(() => {
    if (!habits) return {}
    const map: Record<string, boolean> = {}
    for (const h of habits) {
      if (h.completedToday) {
        map[h.id] = true
      }
    }
    return map
  }, [habits])

  // Build goal name lookup for habits
  const goalNames = useMemo(() => {
    if (!goals) return {}
    const map: Record<string, string> = {}
    for (const g of goals) {
      map[g.id] = g.title
    }
    return map
  }, [goals])

  return (
    <div className="space-y-8">
      {/* ── Goals Section ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
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
        <div className="flex gap-3 mb-4">
          <Select
            className="w-36 rounded-none"
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
            className="w-36 rounded-none"
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
        {goalsLoading ? (
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
          <p className="text-sm text-muted-foreground py-8 text-center">
            No goals yet. Create your first goal to get started!
          </p>
        )}
      </section>

      {/* ── Habits Section ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold text-retro-dark">Habits</h2>
          </div>
          <Button size="sm" onClick={() => setShowHabitForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Habit
          </Button>
        </div>

        {habitsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : habits ? (
          <HabitList
            habits={habits}
            todayLogs={todayLogs}
            goalNames={goalNames}
          />
        ) : null}
      </section>

      {/* ── New Goal Dialog ── */}
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

      {/* ── New Habit Dialog ── */}
      <Dialog
        open={showHabitForm}
        onClose={() => setShowHabitForm(false)}
        title="New Habit"
      >
        <HabitForm
          goals={goals}
          onSubmit={(data) => {
            createHabit.mutate(data, {
              onSuccess: () => setShowHabitForm(false),
            })
          }}
          onCancel={() => setShowHabitForm(false)}
          isLoading={createHabit.isPending}
        />
      </Dialog>
    </div>
  )
}
