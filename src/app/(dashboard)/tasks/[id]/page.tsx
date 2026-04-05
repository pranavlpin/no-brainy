"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Trash2, Focus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { MarkdownEditor } from "@/components/editor/markdown-editor"
import { SubtaskList } from "@/components/tasks/subtask-list"
import { PriorityBadge } from "@/components/tasks/priority-badge"
import { useTask, useUpdateTask, useDeleteTask } from "@/hooks/use-tasks"
import { useTaskLinks, useAddTaskLink, useRemoveTaskLink } from "@/hooks/use-links"
import { useUIStore } from "@/stores/ui-store"
import { LinkManager } from "@/components/linking/link-manager"
import type { LinkedItemData } from "@/components/linking/linked-item"
import { cn } from "@/lib/utils"
import type {
  TaskPriority,
  TaskStatus,
  TaskQuadrant,
  UpdateTaskRequest,
} from "@/lib/types/tasks"

const quadrantOptions: { value: TaskQuadrant; label: string; color: string }[] = [
  { value: "urgent_important", label: "Do First", color: "bg-red-100 border-red-300 dark:bg-red-950/30 dark:border-red-800" },
  { value: "not_urgent_important", label: "Schedule", color: "bg-blue-100 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800" },
  { value: "urgent_not_important", label: "Delegate", color: "bg-yellow-100 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-800" },
  { value: "not_urgent_not_important", label: "Eliminate", color: "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700" },
]

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: task, isLoading } = useTask(id)
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const enterFocusMode = useUIStore((s) => s.enterFocusMode)
  const { data: taskLinks } = useTaskLinks(id)
  const addTaskLink = useAddTaskLink(id)
  const removeTaskLink = useRemoveTaskLink(id)

  const linkItems: LinkedItemData[] = (taskLinks ?? []).map((l) => ({
    targetType: l.linkedType,
    targetId: l.linkedId,
    title: l.title,
    extra: l.extra,
  }))

  const [title, setTitle] = useState("")
  const [descriptionMd, setDescriptionMd] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [status, setStatus] = useState<TaskStatus>("pending")
  const [dueDate, setDueDate] = useState("")
  const [tagsInput, setTagsInput] = useState("")
  const [quadrant, setQuadrant] = useState<TaskQuadrant | "">("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [rrule, setRrule] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Populate form when task loads
  useEffect(() => {
    if (task && !initialized) {
      setTitle(task.title)
      setDescriptionMd(task.descriptionMd)
      setPriority(task.priority)
      setStatus(task.status)
      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "")
      setTagsInput(task.tags.join(", "))
      setQuadrant(task.quadrant ?? "")
      setIsRecurring(task.isRecurring)
      setRrule(task.rrule ?? "")
      setInitialized(true)
    }
  }, [task, initialized])

  // Auto-save with debounce
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleAutoSave = useCallback(
    (updates: UpdateTaskRequest) => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = setTimeout(() => {
        updateTask.mutate({ id, data: updates })
      }, 800)
    },
    [id, updateTask]
  )

  // Field change handlers that trigger auto-save
  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (val.trim()) scheduleAutoSave({ title: val.trim() })
  }

  const handleDescriptionChange = (val: string) => {
    setDescriptionMd(val)
    scheduleAutoSave({ descriptionMd: val })
  }

  const handlePriorityChange = (val: TaskPriority) => {
    setPriority(val)
    scheduleAutoSave({ priority: val })
  }

  const handleStatusChange = (val: TaskStatus) => {
    setStatus(val)
    scheduleAutoSave({ status: val })
  }

  const handleDueDateChange = (val: string) => {
    setDueDate(val)
    scheduleAutoSave({ dueDate: val ? new Date(val).toISOString() : null })
  }

  const handleTagsChange = (val: string) => {
    setTagsInput(val)
    const tags = val
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    scheduleAutoSave({ tags })
  }

  const handleQuadrantChange = (val: TaskQuadrant | "") => {
    setQuadrant(val)
    scheduleAutoSave({ quadrant: val || null })
  }

  const handleRecurringChange = (checked: boolean) => {
    setIsRecurring(checked)
    scheduleAutoSave({ isRecurring: checked, ...(!checked && { rrule: null }) })
  }

  const handleRruleChange = (val: string) => {
    setRrule(val)
    scheduleAutoSave({ rrule: val || null })
  }

  const handleDelete = () => {
    deleteTask.mutate(id, {
      onSuccess: () => router.push("/tasks"),
    })
  }

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading task...
      </div>
    )
  }

  if (!task) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Task not found.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/tasks")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <PriorityBadge priority={priority} />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => enterFocusMode(id)}
        >
          <Focus className="mr-1 h-4 w-4" />
          Focus
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="mr-1 h-4 w-4" />
          Delete
        </Button>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4">
          <p className="text-sm">
            Are you sure you want to delete this task? This action cannot be undone.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteTask.isPending}
            >
              {deleteTask.isPending ? "Deleting..." : "Confirm Delete"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Title */}
      <Input
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        className="text-xl font-bold border-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        placeholder="Task title..."
      />

      {/* Priority + Status + Due Date */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label htmlFor="detail-priority">Priority</Label>
          <Select
            id="detail-priority"
            value={priority}
            onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="detail-status">Status</Label>
          <Select
            id="detail-status"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="detail-due">Due Date</Label>
          <Input
            id="detail-due"
            type="date"
            value={dueDate}
            onChange={(e) => handleDueDateChange(e.target.value)}
          />
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-1">
        <Label htmlFor="detail-tags">Tags</Label>
        <Input
          id="detail-tags"
          value={tagsInput}
          onChange={(e) => handleTagsChange(e.target.value)}
          placeholder="work, personal, project (comma-separated)"
        />
      </div>

      {/* Quadrant selector */}
      <div className="space-y-1">
        <Label>Eisenhower Quadrant</Label>
        <div className="grid grid-cols-2 gap-2">
          {quadrantOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={cn(
                "rounded-md border px-3 py-2 text-sm text-left transition-colors",
                opt.color,
                quadrant === opt.value
                  ? "ring-2 ring-ring ring-offset-1"
                  : "opacity-60 hover:opacity-100"
              )}
              onClick={() =>
                handleQuadrantChange(quadrant === opt.value ? "" : opt.value)
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label>Description</Label>
        <MarkdownEditor
          value={descriptionMd}
          onChange={handleDescriptionChange}
          placeholder="Add a description..."
          minHeight="250px"
        />
      </div>

      {/* Recurring */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="detail-recurring"
            checked={isRecurring}
            onChange={(e) => handleRecurringChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="detail-recurring">Recurring task</Label>
        </div>
        {isRecurring && (
          <Select value={rrule} onChange={(e) => handleRruleChange(e.target.value)}>
            <option value="">Select frequency...</option>
            <option value="FREQ=DAILY">Daily</option>
            <option value="FREQ=WEEKLY">Weekly</option>
            <option value="FREQ=MONTHLY">Monthly</option>
          </Select>
        )}
      </div>

      {/* Subtasks */}
      <SubtaskList parentTaskId={id} subtasks={task.subtasks ?? []} />

      {/* Linked items */}
      <LinkManager
        entityType="task"
        entityId={id}
        links={linkItems}
        onAdd={(targetType, targetId) =>
          addTaskLink.mutate({ linkedType: targetType, linkedId: targetId })
        }
        onRemove={(targetType, targetId) =>
          removeTaskLink.mutate({ linkedType: targetType, linkedId: targetId })
        }
      />

      {/* Save indicator */}
      {updateTask.isPending && (
        <p className="text-xs text-muted-foreground text-right">Saving...</p>
      )}
    </div>
  )
}
