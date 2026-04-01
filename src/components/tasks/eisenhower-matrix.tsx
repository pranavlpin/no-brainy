"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { PriorityBadge } from "./priority-badge"
import { useUpdateTask } from "@/hooks/use-tasks"
import type { TaskResponse, TaskQuadrant } from "@/lib/types/tasks"

interface TaskListItem extends TaskResponse {
  subtasksCount?: number
}

interface EisenhowerMatrixProps {
  tasks: TaskListItem[]
}

const quadrants: {
  key: TaskQuadrant
  label: string
  description: string
  bgClass: string
  borderClass: string
}[] = [
  {
    key: "urgent_important",
    label: "Do First",
    description: "Urgent & Important",
    bgClass: "bg-red-50 dark:bg-red-950/20",
    borderClass: "border-red-200 dark:border-red-900",
  },
  {
    key: "not_urgent_important",
    label: "Schedule",
    description: "Not Urgent & Important",
    bgClass: "bg-blue-50 dark:bg-blue-950/20",
    borderClass: "border-blue-200 dark:border-blue-900",
  },
  {
    key: "urgent_not_important",
    label: "Delegate",
    description: "Urgent & Not Important",
    bgClass: "bg-yellow-50 dark:bg-yellow-950/20",
    borderClass: "border-yellow-200 dark:border-yellow-900",
  },
  {
    key: "not_urgent_not_important",
    label: "Eliminate",
    description: "Neither",
    bgClass: "bg-gray-50 dark:bg-gray-950/20",
    borderClass: "border-gray-200 dark:border-gray-800",
  },
]

export function EisenhowerMatrix({ tasks }: EisenhowerMatrixProps) {
  const router = useRouter()
  const updateTask = useUpdateTask()

  const grouped: Record<TaskQuadrant, TaskListItem[]> = {
    urgent_important: [],
    not_urgent_important: [],
    urgent_not_important: [],
    not_urgent_not_important: [],
  }

  for (const task of tasks) {
    if (task.quadrant && grouped[task.quadrant]) {
      grouped[task.quadrant].push(task)
    }
  }

  const handleToggle = (e: React.MouseEvent, task: TaskListItem) => {
    e.stopPropagation()
    const newStatus = task.status === "completed" ? "pending" : "completed"
    updateTask.mutate({ id: task.id, data: { status: newStatus } })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {quadrants.map((q) => (
        <div
          key={q.key}
          className={cn(
            "rounded-lg border p-4 min-h-[200px]",
            q.bgClass,
            q.borderClass
          )}
        >
          <div className="mb-3">
            <h3 className="font-semibold text-sm">{q.label}</h3>
            <p className="text-xs text-muted-foreground">{q.description}</p>
          </div>

          <div className="space-y-2">
            {grouped[q.key].length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No tasks in this quadrant
              </p>
            ) : (
              grouped[q.key].map((task) => {
                const completed = task.status === "completed"
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 rounded-md bg-background/80 px-3 py-2 cursor-pointer hover:bg-background transition-colors"
                    onClick={() => router.push(`/tasks/${task.id}`)}
                  >
                    <input
                      type="checkbox"
                      checked={completed}
                      onClick={(e) => handleToggle(e, task)}
                      onChange={() => {}}
                      className="h-4 w-4 shrink-0 rounded border-gray-300 cursor-pointer"
                    />
                    <span
                      className={cn(
                        "text-sm flex-1 min-w-0 truncate",
                        completed && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </span>
                    <PriorityBadge priority={task.priority} />
                  </div>
                )
              })
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
