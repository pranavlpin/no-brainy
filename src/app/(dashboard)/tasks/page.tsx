"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, LayoutList, Grid2x2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { TaskList } from "@/components/tasks/task-list"
import { EisenhowerMatrix } from "@/components/tasks/eisenhower-matrix"
import { TaskForm } from "@/components/tasks/task-form"
import { useTasks, useCreateTask } from "@/hooks/use-tasks"
import type {
  TaskStatus,
  TaskPriority,
  CreateTaskRequest,
} from "@/lib/types/tasks"

type ViewMode = "list" | "matrix"

export default function TasksPage() {
  const router = useRouter()
  const [view, setView] = useState<ViewMode>("list")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("")
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("")
  const [showNewForm, setShowNewForm] = useState(false)

  const filters = {
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter as TaskStatus }),
    ...(priorityFilter && { priority: priorityFilter as TaskPriority }),
    sortBy: "orderIndex" as const,
    sortOrder: "asc" as const,
  }

  const { data, isLoading } = useTasks(filters)
  const createTask = useCreateTask()

  const tasks = data?.items ?? []

  const handleCreate = (formData: CreateTaskRequest) => {
    createTask.mutate(formData, {
      onSuccess: (res) => {
        setShowNewForm(false)
        router.push(`/tasks/${res.data.id}`)
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button onClick={() => setShowNewForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* New task form (inline modal) */}
      {showNewForm && (
        <div className="rounded-lg border border-border bg-background p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">New Task</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNewForm(false)}
            >
              Cancel
            </Button>
          </div>
          <TaskForm
            onSubmit={handleCreate}
            isPending={createTask.isPending}
            submitLabel="Create Task"
          />
        </div>
      )}

      {/* Filters + view toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "")}
          className="w-full sm:w-40"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <Select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "")}
          className="w-full sm:w-40"
        >
          <option value="">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>

        <div className="flex gap-1 sm:ml-auto">
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("list")}
            title="List view"
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "matrix" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("matrix")}
            title="Eisenhower Matrix view"
          >
            <Grid2x2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">
          Loading tasks...
        </div>
      ) : view === "list" ? (
        <TaskList tasks={tasks} />
      ) : (
        <EisenhowerMatrix tasks={tasks} />
      )}
    </div>
  )
}
