"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { PriorityBadge } from "./priority-badge"
import { Badge } from "@/components/ui/badge"
import { useUpdateTask } from "@/hooks/use-tasks"
import { ListChecks } from "lucide-react"
import type { TaskResponse } from "@/lib/types/tasks"

interface TaskListItem extends TaskResponse {
  subtasksCount?: number
}

interface TaskListProps {
  tasks: TaskListItem[]
}

function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === "completed" || status === "cancelled") return false
  return new Date(dueDate) < new Date()
}

function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow"

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function TaskList({ tasks }: TaskListProps) {
  const router = useRouter()
  const updateTask = useUpdateTask()

  const handleToggle = (
    e: React.MouseEvent,
    task: TaskListItem
  ) => {
    e.stopPropagation()
    const newStatus = task.status === "completed" ? "pending" : "completed"
    updateTask.mutate({ id: task.id, data: { status: newStatus } })
  }

  if (tasks.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No tasks found. Create one to get started.
      </div>
    )
  }

  return (
    <div className="divide-y divide-border rounded-md border border-border">
      {tasks.map((task) => {
        const overdue = isOverdue(task.dueDate, task.status)
        const completed = task.status === "completed"

        return (
          <div
            key={task.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors"
            onClick={() => router.push(`/tasks/${task.id}`)}
          >
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={completed}
              onClick={(e) => handleToggle(e, task)}
              onChange={() => {}}
              className="h-4 w-4 shrink-0 rounded border-gray-300 cursor-pointer"
            />

            {/* Title + tags */}
            <div className="flex-1 min-w-0">
              <span
                className={cn(
                  "text-sm font-medium",
                  completed && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </span>
              {task.tags.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {task.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Subtask count */}
            {task.subtasksCount != null && task.subtasksCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <ListChecks className="h-3.5 w-3.5" />
                {task.subtasksCount}
              </div>
            )}

            {/* Due date */}
            <span
              className={cn(
                "text-xs shrink-0 w-16 text-right",
                task.dueDate
                  ? overdue
                    ? "text-red-600 font-medium"
                    : "text-muted-foreground"
                  : "text-transparent"
              )}
            >
              {task.dueDate ? formatDueDate(task.dueDate) : "—"}
            </span>

            {/* Priority badge */}
            <PriorityBadge priority={task.priority} />
          </div>
        )
      })}
    </div>
  )
}
