'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Focus,
  Plus,
  Ruler,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardLabel } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedNumber, StaggerBlock, StaggerGroup } from '@/components/motion'
import { GoalForm } from '@/components/goals/goal-form'
import { EvidenceForm } from '@/components/growth/evidence-form'
import { EvidenceList } from '@/components/growth/evidence-list'
import { PracticeCard } from '@/components/growth/practice-card'
import { TaskCheck } from '@/components/tasks/task-check'
import { PriorityBadge } from '@/components/tasks/priority-badge'
import { useDeleteGoal, useGoal, useUpdateGoal } from '@/hooks/use-goals'
import { useCreateTask, useTasks, useUpdateTask } from '@/hooks/use-tasks'
import { useToast } from '@/hooks/use-toast'
import { useUserToday } from '@/hooks/use-user-today'
import { useSetBreadcrumbTitle } from '@/stores/breadcrumb-store'
import { useUIStore } from '@/stores/ui-store'
import { formatDateKey, weekBounds } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { GoalStatus } from '@/lib/types/goals'
import type { EvidenceKind } from '@/lib/types/growth'

const categoryColors: Record<string, 'green' | 'blue' | 'default' | 'orange' | 'yellow'> = {
  fitness: 'green',
  learning: 'blue',
  work: 'default',
  personal: 'orange',
  financial: 'yellow',
}

const statusConfig: Record<
  GoalStatus,
  { label: string; variant: 'green' | 'blue' | 'yellow' | 'gray' }
> = {
  active: { label: 'Active', variant: 'blue' },
  completed: { label: 'Completed', variant: 'green' },
  paused: { label: 'Paused', variant: 'yellow' },
  abandoned: { label: 'Abandoned', variant: 'gray' },
}

export default function GoalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { today } = useUserToday()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [logging, setLogging] = useState<EvidenceKind | null>(null)
  const [newAction, setNewAction] = useState('')

  const { data: goal, isLoading } = useGoal(id)
  useSetBreadcrumbTitle(goal?.title ?? null)
  const updateGoal = useUpdateGoal()
  const deleteGoal = useDeleteGoal()
  const { data: openTasks } = useTasks({
    goalId: id,
    status: 'active',
    sortBy: 'priority',
    sortOrder: 'desc',
  })
  const updateTask = useUpdateTask()
  const createTask = useCreateTask()
  const toast = useToast()
  const enterFocusMode = useUIStore((s) => s.enterFocusMode)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Goal not found.</p>
        <Button variant="link" onClick={() => router.push('/goals')}>
          Back to Goals
        </Button>
      </div>
    )
  }

  const isFinancial = goal.category === 'financial' && !!goal.targetAmount
  const measured = !isFinancial && goal.outcomePercent != null
  const measurable = !isFinancial && goal.baseline != null && goal.target != null
  const totalTasks = goal.taskCount ?? 0
  const completedTasks = goal.completedTaskCount ?? 0
  const taskPct =
    goal.taskPercent ?? (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0)
  const isOverdue =
    goal.targetDate && goal.status === 'active' && new Date(goal.targetDate) < new Date()
  const catVariant = goal.category
    ? (categoryColors[goal.category.toLowerCase()] ?? 'default')
    : null
  const week = weekBounds(today)
  const weekLabel = `${formatDateKey(week.start, { day: 'numeric', month: 'short' })} – ${formatDateKey(week.end, { day: 'numeric', month: 'short' })}`

  const addAction = (event: React.FormEvent) => {
    event.preventDefault()
    const title = newAction.trim()
    if (!title) return
    createTask.mutate(
      { title, goalId: goal.id, context: goal.category === 'work' ? 'work' : undefined },
      {
        onSuccess: () => {
          setNewAction('')
          toast.show('Action added to this goal')
        },
        onError: () => toast.show('Could not add the action', 'error'),
      }
    )
  }

  return (
    <StaggerGroup className="mx-auto max-w-3xl space-y-5">
      <StaggerBlock>
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/goals')}
            aria-label="Back to goals"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold leading-snug text-retro-dark">
              {goal.title}
            </h1>
            {goal.description && (
              <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {catVariant && goal.category && <Badge variant={catVariant}>{goal.category}</Badge>}
              <Badge variant={statusConfig[goal.status].variant}>
                {statusConfig[goal.status].label}
              </Badge>
              {goal.targetDate && (
                <span
                  className={cn(
                    'flex items-center gap-1 font-mono text-xs',
                    isOverdue ? 'font-medium text-retro-pink' : 'text-muted-foreground'
                  )}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {isOverdue ? 'Overdue · ' : 'By '}
                  {formatDateKey(goal.targetDate.slice(0, 10))}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Select
              className="h-9 w-32"
              aria-label="Goal status"
              value={goal.status}
              onChange={(e) =>
                updateGoal.mutate({ id: goal.id, data: { status: e.target.value as GoalStatus } })
              }
            >
              {Object.entries(statusConfig).map(([value, cfg]) => (
                <option key={value} value={value}>
                  {cfg.label}
                </option>
              ))}
            </Select>
            <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
              Edit
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete goal"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="h-4 w-4 text-retro-pink" />
            </Button>
          </div>
        </div>
      </StaggerBlock>

      {/* Success and measurement */}
      <StaggerBlock>
        <Card data-testid="goal-measurement" className="border-retro-mint/40">
          <div className="flex items-start gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-retro-mint/20">
              <Target className="h-4 w-4 text-retro-dark" />
            </span>
            <div className="min-w-0 flex-1">
              <CardLabel>What success looks like</CardLabel>
              <p className="mt-0.5 text-sm text-retro-dark">
                {goal.successCriteria || (
                  <button
                    type="button"
                    className="text-retro-blue underline"
                    onClick={() => setShowEdit(true)}
                  >
                    Describe it so you will recognise it.
                  </button>
                )}
              </p>
            </div>
          </div>

          {isFinancial ? (
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between font-mono text-xs text-retro-dark/60">
                <span>Saved toward the amount</span>
                <span>{goal.financialProgress ?? 0}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-retro-dark/10">
                <motion.div
                  className="h-full rounded-full bg-retro-yellow"
                  initial={false}
                  animate={{ width: `${Math.min(goal.financialProgress ?? 0, 100)}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
            </div>
          ) : measurable ? (
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between font-mono text-xs text-retro-dark/60">
                <span>
                  {goal.baseline}
                  {goal.unit ? ` ${goal.unit}` : ''} → {goal.target}
                  {goal.unit ? ` ${goal.unit}` : ''}
                </span>
                <span className="text-retro-dark">
                  {measured ? (
                    <>
                      <AnimatedNumber value={goal.outcomePercent ?? 0} />% there
                    </>
                  ) : (
                    'No measurement yet'
                  )}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-retro-dark/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-retro-blue to-retro-mint"
                  initial={false}
                  animate={{ width: `${goal.outcomePercent ?? 0}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-retro-dark/60">
                <span>
                  {measured
                    ? `Latest: ${goal.measurement}${goal.unit ? ` ${goal.unit}` : ''} on ${formatDateKey(goal.measurementDate!)}`
                    : 'Log a measurement with your next piece of evidence.'}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px]"
                  onClick={() => setLogging('reflection')}
                >
                  <Ruler className="mr-1 h-3 w-3" /> Log measurement
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-3 font-mono text-[11px] text-retro-dark/50">
              Not measured. Add a starting point and a target in Edit to see outcome progress; task
              completion is shown separately below.
            </p>
          )}

          <div className="mt-4 flex items-center gap-3 border-t border-border/60 pt-3 font-mono text-xs text-retro-dark/60">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>
              Actions: {completedTasks} of {totalTasks} done ({taskPct}%)
            </span>
            <span className="ml-auto">
              {goal.evidenceCount ?? 0} piece{(goal.evidenceCount ?? 0) === 1 ? '' : 's'} of
              evidence
            </span>
          </div>
        </Card>
      </StaggerBlock>

      {/* Practice */}
      {!isFinancial && (
        <StaggerBlock>
          <PracticeCard
            practiceCount={goal.practiceCount ?? 0}
            weeklyPracticeTarget={goal.weeklyPracticeTarget ?? null}
            weekLabel={weekLabel}
            onLog={(kind) => setLogging(kind)}
            onSetTarget={() => setShowEdit(true)}
          />
        </StaggerBlock>
      )}

      {/* Next actions */}
      <StaggerBlock>
        <Card data-testid="goal-next-action">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-retro-blue/15">
              <Sparkles className="h-4 w-4 text-retro-blue" />
            </span>
            <div className="flex-1">
              <CardLabel>Next actions</CardLabel>
              <p className="text-sm font-medium text-retro-dark">
                {openTasks && openTasks.length > 0
                  ? `${openTasks.length} open`
                  : 'Nothing open on this goal'}
              </p>
            </div>
          </div>
          <form className="mt-3 flex gap-2" onSubmit={addAction}>
            <Input
              value={newAction}
              onChange={(e) => setNewAction(e.target.value)}
              placeholder="One step that moves this goal…"
              aria-label="New action for this goal"
              className="min-w-0 flex-1"
            />
            <Button type="submit" size="sm" disabled={!newAction.trim() || createTask.isPending}>
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </form>
          {openTasks && openTasks.length > 0 && (
            <ul className="mt-3 space-y-1">
              {openTasks.slice(0, 8).map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-retro-blue/5"
                >
                  <TaskCheck
                    checked={t.status === 'completed'}
                    label={t.title}
                    size="sm"
                    onChange={(next) =>
                      updateTask.mutate({
                        id: t.id,
                        data: { status: next ? 'completed' : 'pending' },
                      })
                    }
                  />
                  <Link
                    href={`/tasks/${t.id}`}
                    className="min-w-0 flex-1 truncate text-sm text-retro-dark hover:underline"
                  >
                    {t.title}
                  </Link>
                  {t.plannedDate === today ? (
                    <span className="font-mono text-[10px] text-retro-blue">today</span>
                  ) : (
                    <button
                      type="button"
                      className="font-mono text-[10px] text-retro-dark/50 hover:text-retro-blue"
                      onClick={() =>
                        updateTask.mutate(
                          { id: t.id, data: { plannedDate: today } },
                          { onSuccess: () => toast.show('Planned for today') }
                        )
                      }
                    >
                      Plan today
                    </button>
                  )}
                  <PriorityBadge priority={t.priority} className="hidden sm:inline-flex" />
                  <button
                    type="button"
                    aria-label={`Focus on ${t.title}`}
                    onClick={() => enterFocusMode(t.id)}
                    className="rounded-md p-1 text-retro-dark/40 hover:bg-retro-blue/10 hover:text-retro-blue"
                  >
                    <Focus className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </StaggerBlock>

      {/* Evidence */}
      <StaggerBlock>
        <div className="mb-2 flex items-center justify-between px-1">
          <CardLabel>Evidence</CardLabel>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLogging('reflection')}
            data-testid="evidence-add"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Add evidence
          </Button>
        </div>
        <EvidenceList goalId={goal.id} today={today} unit={goal.unit} />
      </StaggerBlock>

      <Dialog
        open={logging !== null}
        onClose={() => setLogging(null)}
        title={
          logging === 'practice'
            ? 'Log practice'
            : logging === 'rest'
              ? 'Log a rest day'
              : logging === 'skip'
                ? 'Log a deliberate skip'
                : 'Add evidence'
        }
        description="Dated, in your words. Rest and skips count for honesty, not against you."
      >
        {logging && (
          <EvidenceForm
            key={logging}
            goalId={goal.id}
            today={today}
            initialKind={logging}
            unit={goal.unit}
            onSaved={() => {
              setLogging(null)
              toast.show('Evidence saved', 'success')
            }}
          />
        )}
      </Dialog>

      <Dialog open={showEdit} onClose={() => setShowEdit(false)} title="Edit goal" size="lg">
        <GoalForm
          goal={goal}
          onSubmit={(data) =>
            updateGoal.mutate({ id: goal.id, data }, { onSuccess: () => setShowEdit(false) })
          }
          onCancel={() => setShowEdit(false)}
          isLoading={updateGoal.isPending}
        />
      </Dialog>

      <Dialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete goal"
        description="This removes the goal and its evidence. Tasks stay, unlinked."
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={() => deleteGoal.mutate(goal.id, { onSuccess: () => router.push('/goals') })}
      />
    </StaggerGroup>
  )
}
