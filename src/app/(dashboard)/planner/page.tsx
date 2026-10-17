'use client'

import { useCallback, useState } from 'react'
import { CalendarCheck, CalendarDays, Flag, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FocusTasks } from '@/components/planner/focus-tasks'
import { TaskSchedule } from '@/components/planner/task-schedule'
import { TriageCard } from '@/components/planner/triage-card'
import { IntentCard } from '@/components/planner/intent-card'
import { CapacityCard } from '@/components/planner/capacity-card'
import { TimeBlocks } from '@/components/planner/time-blocks'
import { AISuggestPanel } from '@/components/planner/ai-suggest-panel'
import { PageHeader } from '@/components/ui/workspace-states'
import { StaggerBlock, StaggerGroup, AnimatedNumber } from '@/components/motion'
import { useTodayPlan, useTriageTask, useUpdatePlan } from '@/hooks/use-planner'
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks'
import { useProjects } from '@/hooks/use-projects'
import { usePlannerAISuggest } from '@/hooks/use-planner-ai'
import { useAI } from '@/hooks/use-ai'
import { useToast } from '@/hooks/use-toast'
import { addDays, formatDateKey } from '@/lib/dates'
import type { TaskResponse } from '@/lib/types/tasks'
import type { CapacitySettings, TimeBlock } from '@/lib/types/planner'
import type { DailyPlanSuggestion } from '@/lib/ai/types'

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <div className="flex items-center gap-3" data-testid="planner-progress">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-retro-dark/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-retro-blue to-retro-mint transition-[width] duration-500 ease-smooth"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-xs font-medium text-retro-dark/60">
        <AnimatedNumber value={completed} /> / {total} done
      </span>
    </div>
  )
}

export default function PlannerPage() {
  const { data: plan, isLoading } = useTodayPlan()
  const { data: projects } = useProjects({ status: 'active' })
  const updatePlan = useUpdatePlan()
  const updateTask = useUpdateTask()
  const createTask = useCreateTask()
  const triage = useTriageTask()
  const aiSuggest = usePlannerAISuggest()
  const { isEnabled: aiEnabled } = useAI()
  const toast = useToast()
  const [suggestion, setSuggestion] = useState<DailyPlanSuggestion | null>(null)

  const handleAISuggest = useCallback(() => {
    aiSuggest.mutate(undefined, { onSuccess: (res) => setSuggestion(res.data) })
  }, [aiSuggest])

  const handleAcceptSuggestion = useCallback(
    (taskIds: string[], briefMd: string) => {
      updatePlan.mutate({ focusTaskIds: taskIds, aiBriefMd: briefMd })
      setSuggestion(null)
    },
    [updatePlan]
  )

  const handleUpdateFocus = useCallback(
    (focusTaskIds: string[]) => updatePlan.mutate({ focusTaskIds }),
    [updatePlan]
  )

  const handleToggleComplete = useCallback(
    (taskId: string, completed: boolean) => {
      updateTask.mutate({ id: taskId, data: { status: completed ? 'completed' : 'pending' } })
    },
    [updateTask]
  )

  const handleSaveIntent = useCallback(
    (intent: string) => {
      updatePlan.mutate({ intentMd: intent || null })
    },
    [updatePlan]
  )

  const handleCapacityChange = useCallback(
    (patch: Partial<CapacitySettings>) => updatePlan.mutate(patch),
    [updatePlan]
  )

  const handleBlocksChange = useCallback(
    (timeBlocks: TimeBlock[]) => updatePlan.mutate({ timeBlocks }),
    [updatePlan]
  )

  const handleMoveToTomorrow = useCallback(
    (taskIds: string[]) => {
      if (!plan || taskIds.length === 0) return
      const tomorrow = addDays(plan.planDate.slice(0, 10), 1)
      for (const id of taskIds) updateTask.mutate({ id, data: { plannedDate: tomorrow } })
      toast.show(
        `Moved ${taskIds.length} task${taskIds.length === 1 ? '' : 's'} to tomorrow`,
        'success'
      )
    },
    [plan, updateTask, toast]
  )

  const handleMakeIntentTask = useCallback(
    (intent: string) => {
      if (!plan) return
      const today = plan.planDate.slice(0, 10)
      createTask.mutate(
        { title: intent, priority: 'high', plannedDate: today, tags: ['intent'] },
        {
          onSuccess: (res) => {
            const nextIds = [res.data.id, ...plan.focusTaskIds].slice(0, 3)
            updatePlan.mutate({ focusTaskIds: nextIds })
            toast.show('Intent is now your first focus task')
          },
          onError: () => toast.show('Could not create the task', 'error'),
        }
      )
    },
    [plan, createTask, updatePlan, toast]
  )

  if (isLoading || !plan) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    )
  }

  const todayKeyStr = plan.planDate.slice(0, 10)
  const dateLabel = formatDateKey(todayKeyStr, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const plannedTasks = plan.plannedTasks ?? []
  const seen = new Set<string>()
  const allDayTasks: TaskResponse[] = []
  for (const task of [...plan.focusTasks, ...plannedTasks, ...plan.tasksDueToday]) {
    if (!seen.has(task.id)) {
      seen.add(task.id)
      allDayTasks.push(task)
    }
  }
  const completedCount = allDayTasks.filter((t) => t.status === 'completed').length
  const plannedList = plannedTasks.filter((t) => !plan.focusTaskIds.includes(t.id))
  const deadlineList = plan.tasksDueToday.filter(
    (t) => !plan.focusTaskIds.includes(t.id) && !plannedList.some((p) => p.id === t.id)
  )
  const intentIsTask = !!plan.intentMd && allDayTasks.some((t) => t.title === plan.intentMd)
  const linkableTasks = allDayTasks
    .filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
    .map((t) => ({ id: t.id, title: t.title }))

  return (
    <StaggerGroup className="mx-auto max-w-3xl space-y-5">
      <StaggerBlock>
        <PageHeader
          eyebrow="Today"
          title="Plan the day"
          icon={<CalendarDays className="h-5 w-5 text-retro-blue" />}
          description={dateLabel}
        >
          {aiEnabled && !suggestion && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAISuggest}
              disabled={aiSuggest.isPending}
            >
              {aiSuggest.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Thinking…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI suggest
                </>
              )}
            </Button>
          )}
        </PageHeader>
      </StaggerBlock>

      {allDayTasks.length > 0 && (
        <StaggerBlock className="surface-glass rounded-2xl px-5 py-4">
          <ProgressBar completed={completedCount} total={allDayTasks.length} />
        </StaggerBlock>
      )}

      <StaggerBlock>
        <IntentCard
          intent={plan.intentMd}
          sourceLabel={plan.intentMd ? 'Carried in from last night' : undefined}
          onSave={handleSaveIntent}
          onMakeTask={handleMakeIntentTask}
          taskCreated={intentIsTask}
        />
      </StaggerBlock>

      <StaggerBlock>
        <TriageCard
          tasks={plan.carryForward}
          today={todayKeyStr}
          onTriage={(decision) => triage.mutate(decision)}
        />
      </StaggerBlock>

      <StaggerBlock>
        <CapacityCard
          tasks={allDayTasks}
          blocks={plan.timeBlocks}
          availableMinutes={plan.availableMinutes}
          bufferMinutes={plan.bufferMinutes}
          workStart={plan.workStart}
          workEnd={plan.workEnd}
          protectedIds={plan.focusTaskIds}
          onChange={handleCapacityChange}
          onMoveTasks={handleMoveToTomorrow}
        />
      </StaggerBlock>

      {suggestion && (
        <StaggerBlock>
          <AISuggestPanel
            suggestion={suggestion}
            allTasks={[...plan.focusTasks, ...plan.tasksDueToday, ...plan.carryForward]}
            onAccept={handleAcceptSuggestion}
            onDismiss={() => setSuggestion(null)}
          />
        </StaggerBlock>
      )}

      <StaggerBlock>
        <FocusTasks
          focusTasks={plan.focusTasks}
          focusTaskIds={plan.focusTaskIds}
          allTasks={[...plannedTasks, ...plan.tasksDueToday, ...plan.carryForward]}
          goals={plan.goals}
          projects={projects}
          onUpdate={handleUpdateFocus}
          onToggleComplete={handleToggleComplete}
        />
      </StaggerBlock>

      <StaggerBlock>
        <TimeBlocks blocks={plan.timeBlocks} tasks={linkableTasks} onChange={handleBlocksChange} />
      </StaggerBlock>

      <StaggerBlock>
        <div className="mb-3 flex items-center gap-2 px-1">
          <CalendarCheck className="h-4 w-4 text-retro-blue" />
          <h2 className="font-display text-base font-semibold text-retro-dark">
            Planned for today
          </h2>
        </div>
        <TaskSchedule
          tasks={plannedList}
          goals={plan.goals}
          onToggleComplete={handleToggleComplete}
          emptyMessage="Nothing else planned. Give a task a planned day and it shows up here."
          testId="planned-today-list"
        />
      </StaggerBlock>

      <StaggerBlock>
        <div className="mb-3 flex items-center gap-2 px-1">
          <Flag className="h-4 w-4 text-retro-pink" />
          <h2 className="font-display text-base font-semibold text-retro-dark">Deadlines today</h2>
        </div>
        <TaskSchedule
          tasks={deadlineList}
          goals={plan.goals}
          onToggleComplete={handleToggleComplete}
          emptyMessage="No deadlines land today."
        />
      </StaggerBlock>
    </StaggerGroup>
  )
}
