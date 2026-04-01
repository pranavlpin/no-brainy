"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCreateTask, useUpdateTask } from "@/hooks/use-tasks"
import type { TaskResponse } from "@/lib/types/tasks"

interface SubtaskListProps {
  parentTaskId: string
  subtasks: TaskResponse[]
}

export function SubtaskList({ parentTaskId, subtasks }: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const handleAdd = () => {
    if (!newTitle.trim()) return
    createTask.mutate(
      { title: newTitle.trim(), parentTaskId },
      {
        onSuccess: () => {
          setNewTitle("")
          setIsAdding(false)
        },
      }
    )
  }

  const handleToggle = (subtask: TaskResponse) => {
    const newStatus = subtask.status === "completed" ? "pending" : "completed"
    updateTask.mutate({ id: subtask.id, data: { status: newStatus } })
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Subtasks</h3>
      <ul className="space-y-1">
        {subtasks.map((subtask) => (
          <li key={subtask.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={subtask.status === "completed"}
              onChange={() => handleToggle(subtask)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span
              className={cn(
                "text-sm",
                subtask.status === "completed" &&
                  "line-through text-muted-foreground"
              )}
            >
              {subtask.title}
            </span>
          </li>
        ))}
      </ul>

      {isAdding ? (
        <div className="flex items-center gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Subtask title..."
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd()
              if (e.key === "Escape") {
                setIsAdding(false)
                setNewTitle("")
              }
            }}
            autoFocus
          />
          <Button size="sm" onClick={handleAdd} disabled={createTask.isPending}>
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsAdding(false)
              setNewTitle("")
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add subtask
        </Button>
      )}
    </div>
  )
}
