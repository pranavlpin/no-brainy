"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { MarkdownEditor } from "@/components/editor/markdown-editor"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight } from "lucide-react"
import type {
  TaskPriority,
  TaskStatus,
  TaskQuadrant,
  CreateTaskRequest,
} from "@/lib/types/tasks"

interface TaskFormProps {
  initialData?: Partial<CreateTaskRequest>
  onSubmit: (data: CreateTaskRequest) => void
  isPending?: boolean
  submitLabel?: string
}

const quadrantOptions: { value: TaskQuadrant; label: string; color: string }[] = [
  { value: "urgent_important", label: "Do First", color: "bg-red-100 border-red-300 dark:bg-red-950/30 dark:border-red-800" },
  { value: "not_urgent_important", label: "Schedule", color: "bg-blue-100 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800" },
  { value: "urgent_not_important", label: "Delegate", color: "bg-yellow-100 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-800" },
  { value: "not_urgent_not_important", label: "Eliminate", color: "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700" },
]

export function TaskForm({
  initialData,
  onSubmit,
  isPending,
  submitLabel = "Save",
}: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "")
  const [descriptionMd, setDescriptionMd] = useState(initialData?.descriptionMd ?? "")
  const [priority, setPriority] = useState<TaskPriority>(initialData?.priority ?? "medium")
  const [status, setStatus] = useState<TaskStatus>(initialData?.status ?? "pending")
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? "")
  const [tagsInput, setTagsInput] = useState((initialData?.tags ?? []).join(", "))
  const [quadrant, setQuadrant] = useState<TaskQuadrant | "">(initialData?.quadrant ?? "")
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring ?? false)
  const [rrule, setRrule] = useState(initialData?.rrule ?? "")
  const [showDescription, setShowDescription] = useState(!!initialData?.descriptionMd)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    const data: CreateTaskRequest = {
      title: title.trim(),
      priority,
      status,
      tags,
      ...(descriptionMd && { descriptionMd }),
      ...(dueDate && { dueDate }),
      ...(quadrant && { quadrant }),
      isRecurring,
      ...(isRecurring && rrule && { rrule }),
    }

    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div className="space-y-1">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
          required
        />
      </div>

      {/* Description (collapsible) */}
      <div>
        <button
          type="button"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setShowDescription(!showDescription)}
        >
          {showDescription ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Description
        </button>
        {showDescription && (
          <div className="mt-2">
            <MarkdownEditor
              value={descriptionMd}
              onChange={setDescriptionMd}
              placeholder="Add a description..."
              minHeight="200px"
            />
          </div>
        )}
      </div>

      {/* Priority + Status row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="priority">Priority</Label>
          <Select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      {/* Due Date */}
      <div className="space-y-1">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          value={dueDate ? dueDate.split("T")[0] : ""}
          onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value).toISOString() : "")}
        />
      </div>

      {/* Tags */}
      <div className="space-y-1">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
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
                setQuadrant(quadrant === opt.value ? "" : opt.value)
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recurring */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="recurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="recurring">Recurring task</Label>
        </div>
        {isRecurring && (
          <Select
            value={rrule}
            onChange={(e) => setRrule(e.target.value)}
          >
            <option value="">Select frequency...</option>
            <option value="FREQ=DAILY">Daily</option>
            <option value="FREQ=WEEKLY">Weekly</option>
            <option value="FREQ=MONTHLY">Monthly</option>
          </Select>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isPending || !title.trim()}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}
