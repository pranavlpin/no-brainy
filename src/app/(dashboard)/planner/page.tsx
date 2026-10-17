'use client'

import { useCallback, useState } from 'react'
import { CalendarDays, ListTodo, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FocusTasks } from '@/components/planner/focus-tasks'
import { TaskSchedule } from '@/components/planner/task-schedule'
import { TriageCard } from '@/components/planner/triage-card'
import { IntentCard } from '@/components/planner/intent-card'
import { AISuggestPanel } from '@/components/planner/ai-suggest-panel'
import { StaggerBlock, StaggerGroup, AnimatedNumber } from '@/components/motion'
import { useTodayPlan, useTriageTask, useUpdatePlan } from '@/hooks/use-planner'
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks'
import { usePlannerAISuggest } from '@/hooks/use-planner-ai'
import { useAI } from '@/hooks/use-ai'
import { useToast } from '@/hooks/use-toast'
import { formatDateKey } from '@/lib/dates'
import type { TaskResponse } from '@/lib/types/tasks'
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

  const handleMakeIntentTask = useCallback(
    (intent: string) => {
      if (!plan) return
      const today = plan.planDate.slice(0, 10)
      createTask.mutate(
        { title: intent, priority: 'high', dueDate: today, tags: ['intent'] },
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

  const seen = new Set<string>()
  const allDayTasks: TaskResponse[] = []
  for (const task of [...plan.focusTasks, ...plan.tasksDueToday]) {
    if (!seen.has(task.id)) {
      seen.add(task.id)
      allDayTasks.push(task)
    }
  }
  const completedCount = allDayTasks.filter((t) => t.status === 'completed').length
  const scheduleTasks = plan.tasksDueToday.filter((t) => !plan.focusTaskIds.includes(t.id))
  const intentIsTask = !!plan.intentMd && allDayTasks.some((t) => t.title === plan.intentMd)

  return (
    <StaggerGroup className="mx-auto max-w-3xl space-y-5">
      <StaggerBlock>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-retro-blue" />
              <h1 className="font-display text-2xl font-bold text-retro-dark">Plan the day</h1>
            </div>
            <p className="mt-1 font-mono text-sm text-retro-dark/60">{dateLabel}</p>
          </div>
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
        </div>
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
          allTasks={[...plan.tasksDueToday, ...plan.carryForward]}
          goals={plan.goals}
          onUpdate={handleUpdateFocus}
          onToggleComplete={handleToggleComplete}
        />
      </StaggerBlock>

      <StaggerBlock>
        <div className="mb-3 flex items-center gap-2 px-1">
          <ListTodo className="h-4 w-4 text-retro-blue" />
          <h2 className="font-display text-base font-semibold text-retro-dark">Also due today</h2>
        </div>
        <TaskSchedule
          tasks={scheduleTasks}
          goals={plan.goals}
          onToggleComplete={handleToggleComplete}
        />
      </StaggerBlock>
    </StaggerGroup>
  )
}
