"use client"

import { useState, useEffect, useCallback } from "react"
import { Calendar, ListTodo, TrendingUp, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FocusTasks } from "@/components/planner/focus-tasks"
import { TaskSchedule } from "@/components/planner/task-schedule"
import { CarryForwardBanner } from "@/components/planner/carry-forward-banner"
import { AISuggestPanel } from "@/components/planner/ai-suggest-panel"
import { useTodayPlan, useUpdatePlan, useCarryForward } from "@/hooks/use-planner"
import { useUpdateTask } from "@/hooks/use-tasks"
import { usePlannerAISuggest } from "@/hooks/use-planner-ai"
import { useAI } from "@/hooks/use-ai"
import type { TaskResponse } from "@/lib/types/tasks"
import type { DailyPlanSuggestion } from "@/lib/ai/types"

function ProgressBar({
  completed,
  total,
}: {
  completed: number
  total: number
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium text-muted-foreground">
        {completed}/{total} done
      </span>
    </div>
  )
}

export default function PlannerPage() {
  const { data: plan, isLoading } = useTodayPlan()
  const updatePlan = useUpdatePlan()
  const updateTask = useUpdateTask()
  const carryForward = useCarryForward()
  const aiSuggest = usePlannerAISuggest()
  const { isEnabled: aiEnabled } = useAI()
  const [suggestion, setSuggestion] = useState<DailyPlanSuggestion | null>(null)

  useEffect(() => {
    carryForward.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAISuggest = useCallback(() => {
    aiSuggest.mutate(undefined, {
      onSuccess: (res) => {
        setSuggestion(res.data)
      },
    })
  }, [aiSuggest])

  const handleAcceptSuggestion = useCallback(
    (taskIds: string[], briefMd: string) => {
      updatePlan.mutate({ focusTaskIds: taskIds, aiBriefMd: briefMd })
      setSuggestion(null)
    },
    [updatePlan]
  )

  const handleUpdateFocus = useCallback(
    (focusTaskIds: string[]) => {
      updatePlan.mutate({ focusTaskIds })
    },
    [updatePlan]
  )

  const handleToggleComplete = useCallback(
    (taskId: string, completed: boolean) => {
      updateTask.mutate({
        id: taskId,
        data: { status: completed ? "completed" : "pending" },
      })
    },
    [updateTask]
  )

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!plan) return null

  const today = new Date()
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  // Combine all tasks for progress calculation
  const allDayTasks: TaskResponse[] = []
  const seenIds = new Set<string>()
  for (const task of [...plan.focusTasks, ...plan.tasksDueToday]) {
    if (!seenIds.has(task.id)) {
      seenIds.add(task.id)
      allDayTasks.push(task)
    }
  }

  const completedCount = allDayTasks.filter(
    (t) => t.status === "completed"
  ).length
  const totalCount = allDayTasks.length

  // Tasks for task schedule that are not already focus tasks
  const scheduleTasks = plan.tasksDueToday.filter(
    (t) => !plan.focusTaskIds.includes(t.id)
  )

  const carryForwardSuggestions = carryForward.data?.data?.suggestions ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Today</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{dateLabel}</p>
      </div>

      {/* Progress */}
      {totalCount > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Daily Progress</span>
          </div>
          <ProgressBar completed={completedCount} total={totalCount} />
        </div>
      )}

      {/* Carry Forward Banner */}
      <CarryForwardBanner
        suggestions={carryForwardSuggestions}
        currentFocusIds={plan.focusTaskIds}
        onAddToFocus={handleUpdateFocus}
      />

      {/* AI Suggest */}
      {aiEnabled && !suggestion && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAISuggest}
            disabled={aiSuggest.isPending}
          >
            {aiSuggest.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suggesting...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                AI Suggest
              </>
            )}
          </Button>
        </div>
      )}

      {suggestion && plan && (
        <AISuggestPanel
          suggestion={suggestion}
          allTasks={[...plan.focusTasks, ...plan.tasksDueToday, ...carryForwardSuggestions]}
          onAccept={handleAcceptSuggestion}
          onDismiss={() => setSuggestion(null)}
        />
      )}

      {/* Focus Tasks */}
      <FocusTasks
        focusTasks={plan.focusTasks}
        focusTaskIds={plan.focusTaskIds}
        allTasks={[...plan.tasksDueToday, ...carryForwardSuggestions]}
        onUpdate={handleUpdateFocus}
        onToggleComplete={handleToggleComplete}
      />

      {/* Tasks Due Today */}
      {scheduleTasks.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Tasks Due Today</h2>
          </div>
          <TaskSchedule
            tasks={scheduleTasks}
            onToggleComplete={handleToggleComplete}
          />
        </div>
      )}
    </div>
  )
}
