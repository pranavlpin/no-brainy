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
import { TaskAIPanel } from "@/components/tasks/task-ai-panel"
import { useTasks, useCreateTask } from "@/hooks/use-tasks"
import type {
  TaskPriority,
  CreateTaskRequest,
} from "@/lib/types/tasks"

type ViewMode = "list" | "matrix"

export default function TasksPage() {
  const router = useRouter()
  const [view, setView] = useState<ViewMode>("list")
  const [search, setSearch] = useState("")
  const [showCompleted, setShowCompleted] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("")
  const [sortBy, setSortBy] = useState<string>("orderIndex:asc")
  const [showNewForm, setShowNewForm] = useState(false)

  const [sortField, sortOrder] = sortBy.split(":") as [string, "asc" | "desc"]

  const filters = {
    ...(search && { search }),
    ...(!showCompleted && { status: "pending" as const }),
    ...(priorityFilter && { priority: priorityFilter as TaskPriority }),
    sortBy: sortField as "createdAt" | "updatedAt" | "dueDate" | "priority" | "orderIndex",
    sortOrder,
  }

  const { data, isLoading } = useTasks(filters)
  const createTask = useCreateTask()

  const tasks = data ?? []

  const handleCreate = (formData: CreateTaskRequest) => {
    createTask.mutate(formData, {
      onSuccess: () => {
        setShowNewForm(false)
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-retro-dark">Tasks</h1>
        <div className="flex items-center gap-2">
          <TaskAIPanel />
          <button
            onClick={() => setShowNewForm(true)}
            className="border-2 border-retro-dark bg-retro-blue px-4 py-2 font-mono text-sm font-bold text-white shadow-hard hover-shadow-grow"
          >
            <Plus className="mr-2 inline h-4 w-4" />
            New Task
          </button>
        </div>
      </div>

      {/* New task form */}
      {showNewForm && (
        <div className="rounded-lg border border-border bg-background p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">New Task</h2>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-52"
        />
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
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full sm:w-44"
        >
          <option value="orderIndex:asc">Manual order</option>
          <option value="priority:desc">Priority (highest)</option>
          <option value="priority:asc">Priority (lowest)</option>
          <option value="dueDate:asc">Due date (soonest)</option>
          <option value="dueDate:desc">Due date (latest)</option>
          <option value="createdAt:desc">Created (newest)</option>
          <option value="createdAt:asc">Created (oldest)</option>
        </Select>

        <label className="flex items-center gap-2 shrink-0 cursor-pointer">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="h-4 w-4 accent-retro-blue cursor-pointer"
          />
          <span className="font-mono text-xs text-retro-dark/60">Show completed</span>
        </label>

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
