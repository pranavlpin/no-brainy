"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PriorityBadge } from "@/components/tasks/priority-badge"
import { CheckCircle2, Circle, X, Plus, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TaskResponse } from "@/lib/types/tasks"

interface FocusTasksProps {
  focusTasks: TaskResponse[]
  focusTaskIds: string[]
  allTasks: TaskResponse[]
  onUpdate: (focusTaskIds: string[]) => void
  onToggleComplete: (taskId: string, completed: boolean) => void
}

export function FocusTasks({
  focusTasks,
  focusTaskIds,
  allTasks,
  onUpdate,
  onToggleComplete,
}: FocusTasksProps) {
  const [showPicker, setShowPicker] = useState(false)
  const emptySlots = 3 - focusTasks.length

  const availableTasks = allTasks.filter(
    (t) =>
      !focusTaskIds.includes(t.id) &&
      t.status !== "completed" &&
      t.status !== "cancelled"
  )

  const handleRemove = (taskId: string) => {
    onUpdate(focusTaskIds.filter((id) => id !== taskId))
  }

  const handleAdd = (taskId: string) => {
    if (focusTaskIds.length >= 3) return
    onUpdate([...focusTaskIds, taskId])
    setShowPicker(false)
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Focus Tasks</h2>
        <Badge variant="secondary" className="ml-auto">
          {focusTasks.filter((t) => t.status === "completed").length} / {focusTasks.length}
        </Badge>
      </div>

      <div className="grid gap-3">
        {focusTasks.map((task) => {
          const isCompleted = task.status === "completed"
          return (
            <div
              key={task.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-4 transition-colors",
                isCompleted
                  ? "border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-950/20"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              <button
                onClick={() => onToggleComplete(task.id, !isCompleted)}
                className="mt-0.5 shrink-0"
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "font-medium",
                    isCompleted && "text-muted-foreground line-through"
                  )}
                >
                  {task.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <PriorityBadge priority={task.priority} />
                  {task.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      Due {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemove(task.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}

        {Array.from({ length: emptySlots }).map((_, i) => (
          <button
            key={`empty-${i}`}
            onClick={() => setShowPicker(true)}
            className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 p-4 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">Add focus task</span>
          </button>
        ))}
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowPicker(false)}
          />
          <div className="relative z-50 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Select a focus task</h3>
            {availableTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No available tasks. Create a task first.
              </p>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {availableTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleAdd(task.id)}
                    className="flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors hover:bg-accent"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{task.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setShowPicker(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
