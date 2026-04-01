'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Trash2, CheckCircle2, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { GoalForm } from '@/components/goals/goal-form'
import { useGoal, useUpdateGoal, useDeleteGoal } from '@/hooks/use-goals'
import type { GoalStatus } from '@/lib/types/goals'

const categoryColors: Record<string, 'green' | 'blue' | 'default' | 'orange'> = {
  fitness: 'green',
  learning: 'blue',
  work: 'default',
  personal: 'orange',
}

const statusConfig: Record<GoalStatus, { label: string; variant: 'green' | 'blue' | 'yellow' | 'gray' }> = {
  active: { label: 'Active', variant: 'blue' },
  completed: { label: 'Completed', variant: 'green' },
  paused: { label: 'Paused', variant: 'yellow' },
  abandoned: { label: 'Abandoned', variant: 'gray' },
}

function getProgressColor(pct: number): string {
  if (pct >= 75) return 'bg-green-500'
  if (pct >= 50) return 'bg-blue-500'
  if (pct >= 25) return 'bg-yellow-500'
  return 'bg-gray-400'
}

export default function GoalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const { data: goal, isLoading } = useGoal(id)
  const updateGoal = useUpdateGoal()
  const deleteGoal = useDeleteGoal()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Goal not found.</p>
        <Button variant="link" onClick={() => router.push('/goals')}>
          Back to Goals
        </Button>
      </div>
    )
  }

  const totalTasks = goal.taskCount ?? 0
  const completedTasks = goal.completedTaskCount ?? 0
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const habitCount = goal.habits?.length ?? 0

  const isOverdue =
    goal.targetDate &&
    goal.status === 'active' &&
    new Date(goal.targetDate) < new Date()

  const catVariant = goal.category
    ? categoryColors[goal.category.toLowerCase()] ?? 'default'
    : null

  function handleStatusChange(newStatus: GoalStatus) {
    updateGoal.mutate({ id: goal!.id, data: { status: newStatus } })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.push('/goals')}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Goals
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{goal.title}</h1>
          {goal.description && (
            <p className="text-muted-foreground">{goal.description}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {catVariant && goal.category && (
              <Badge variant={catVariant}>{goal.category}</Badge>
            )}
            {goal.targetDate && (
              <span className={`flex items-center gap-1 text-sm ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                <Calendar className="h-4 w-4" />
                {isOverdue ? 'Overdue - ' : ''}
                {new Date(goal.targetDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Status:</span>
        <Select
          className="w-40"
          value={goal.status}
          onChange={(e) => handleStatusChange(e.target.value as GoalStatus)}
        >
          {Object.entries(statusConfig).map(([value, cfg]) => (
            <option key={value} value={value}>
              {cfg.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Progress */}
      <div className="rounded-lg border border-border p-4 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium">Progress</span>
          <span className="text-muted-foreground">{progressPct}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className={`h-full rounded-full transition-all ${getProgressColor(progressPct)}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {completedTasks} of {totalTasks} linked tasks completed
        </p>
      </div>

      {/* Linked tasks placeholder */}
      <div className="rounded-lg border border-border p-4 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Linked Tasks</h3>
          <span className="text-xs text-muted-foreground">({totalTasks})</span>
        </div>
        {totalTasks === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tasks linked to this goal yet. Assign tasks to this goal from the Tasks page.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {completedTasks} completed, {totalTasks - completedTasks} remaining
          </p>
        )}
      </div>

      {/* Linked habits */}
      <div className="rounded-lg border border-border p-4 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2 mb-3">
          <Repeat className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Linked Habits</h3>
          <span className="text-xs text-muted-foreground">({habitCount})</span>
        </div>
        {goal.habits && goal.habits.length > 0 ? (
          <ul className="space-y-2">
            {goal.habits.map((habit) => (
              <li key={habit.id} className="flex items-center justify-between text-sm">
                <span>{habit.title}</span>
                <Badge variant="blue" className="text-xs">
                  {habit.frequency}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No habits linked to this goal yet.
          </p>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Goal"
      >
        <GoalForm
          goal={goal}
          onSubmit={(data) => {
            updateGoal.mutate(
              { id: goal.id, data },
              { onSuccess: () => setShowEdit(false) }
            )
          }}
          onCancel={() => setShowEdit(false)}
          isLoading={updateGoal.isPending}
        />
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Goal"
        description="Are you sure you want to delete this goal? This action cannot be undone."
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={() => {
          deleteGoal.mutate(goal.id, {
            onSuccess: () => router.push('/goals'),
          })
        }}
      />
    </div>
  )
}
