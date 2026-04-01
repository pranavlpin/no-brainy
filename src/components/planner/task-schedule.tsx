"use client"

import { CheckCircle2, Circle, Clock } from "lucide-react"
import { PriorityBadge } from "@/components/tasks/priority-badge"
import { cn } from "@/lib/utils"
import type { TaskResponse } from "@/lib/types/tasks"

interface TaskScheduleProps {
  tasks: TaskResponse[]
  onToggleComplete: (taskId: string, completed: boolean) => void
}

export function TaskSchedule({ tasks, onToggleComplete }: TaskScheduleProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <Clock className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          No tasks due today
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const isCompleted = task.status === "completed"
        return (
          <div
            key={task.id}
            className={cn(
              "flex items-center gap-3 rounded-md border px-4 py-3 transition-colors",
              isCompleted
                ? "border-green-200/50 bg-green-50/30 dark:border-green-900/20 dark:bg-green-950/10"
                : "border-border"
            )}
          >
            <button
              onClick={() => onToggleComplete(task.id, !isCompleted)}
              className="shrink-0"
            >
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground hover:text-primary" />
              )}
            </button>
            <span
              className={cn(
                "flex-1 text-sm",
                isCompleted && "text-muted-foreground line-through"
              )}
            >
              {task.title}
            </span>
            <PriorityBadge priority={task.priority} />
            {task.dueDate && (
              <span className="text-xs text-muted-foreground">
                {new Date(task.dueDate).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
