'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSetBreadcrumbTitle } from '@/stores/breadcrumb-store'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Focus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { SaveStatus } from '@/components/ui/save-status'
import { MarkdownEditor } from '@/components/editor/markdown-editor'
import { SubtaskList } from '@/components/tasks/subtask-list'
import { PriorityBadge } from '@/components/tasks/priority-badge'
import { TaskPlanningFields } from '@/components/tasks/task-planning-fields'
import { useTask, useDeleteTask, taskDraftBody, applyTaskUpdate } from '@/hooks/use-tasks'
import { useDraftSave } from '@/hooks/use-draft-save'
import { useTaskLinks, useAddTaskLink, useRemoveTaskLink } from '@/hooks/use-links'
import { useUIStore } from '@/stores/ui-store'
import { LinkManager } from '@/components/linking/link-manager'
import type { LinkedItemData } from '@/components/linking/linked-item'
import { apiClient } from '@/lib/api-client'
import { patchCaches } from '@/lib/query/optimistic'
import { cn } from '@/lib/utils'
import type { ApiResponse } from '@/lib/types/api'
import type { TaskPriority, TaskStatus, TaskQuadrant, TaskResponse } from '@/lib/types/tasks'

const quadrantOptions: { value: TaskQuadrant; label: string; color: string }[] = [
  {
    value: 'urgent_important',
    label: 'Do First',
    color: 'bg-red-100 border-red-300 dark:bg-red-950/30 dark:border-red-800',
  },
  {
    value: 'not_urgent_important',
    label: 'Schedule',
    color: 'bg-blue-100 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800',
  },
  {
    value: 'urgent_not_important',
    label: 'Delegate',
    color: 'bg-yellow-100 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-800',
  },
  {
    value: 'not_urgent_not_important',
    label: 'Eliminate',
    color: 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700',
  },
]

/** Lists and dashboards that embed task objects and must see a saved draft. */
const TASK_BEARING_KEYS = [['tasks'], ['planner'], ['home'], ['goals']]

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params.id as string

  const { data: task, isLoading, refetch } = useTask(id)

  useSetBreadcrumbTitle(task?.title ?? null)
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

  const draft = useDraftSave<TaskResponse>(
    'task',
    task,
    async (patch, version) => {
      const body = taskDraftBody(patch, version)
      const res = await apiClient<ApiResponse<TaskResponse>>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      })
      const saved = res.data
      queryClient.setQueryData<ApiResponse<TaskResponse>>(['tasks', id], (old) =>
        old ? { ...old, data: { ...old.data, ...saved } } : old
      )
      for (const key of TASK_BEARING_KEYS) {
        patchCaches<TaskResponse>(
          queryClient,
          key,
          (t) => t.id === id,
          (t) => ({ ...applyTaskUpdate(t, body), updatedAt: saved.updatedAt })
        )
      }
      return saved
    },
    async () => (await refetch()).data
  )
  const value = draft.value

  // Title keeps a local echo so an empty field never becomes an invalid save.
  const [titleEcho, setTitleEcho] = useState<string | null>(null)
  const [tagsEcho, setTagsEcho] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    setTitleEcho(null)
    setTagsEcho(null)
  }, [value?.updatedAt])

  const handleDelete = () => {
    deleteTask.mutate(id, {
      onSuccess: () => router.push('/tasks'),
    })
  }

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Loading task...</div>
  }

  if (!task || !value) {
    return <div className="py-12 text-center text-muted-foreground">Task not found.</div>
  }

  const priority = value.priority
  const status = value.status
  const quadrant = value.quadrant ?? ''
  const titleShown = titleEcho ?? value.title
  const tagsShown = tagsEcho ?? value.tags.join(', ')

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/tasks')}
          aria-label="Back to tasks"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-1 items-center gap-3">
          <PriorityBadge priority={priority} />
          <SaveStatus
            state={draft.state}
            durable={draft.durable}
            retry={draft.retry}
            resolve={draft.resolve}
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => enterFocusMode(id)}>
          <Focus className="mr-1 h-4 w-4" />
          Focus
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
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
              {deleteTask.isPending ? 'Deleting...' : 'Confirm Delete'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Title */}
      <Input
        value={titleShown}
        onChange={(e) => {
          const next = e.target.value
          setTitleEcho(next)
          if (next.trim()) draft.change({ title: next })
        }}
        onBlur={() => {
          if (!titleShown.trim()) setTitleEcho(null)
        }}
        aria-label="Task title"
        className="border-none px-0 text-xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
        placeholder="Task title..."
      />

      {/* Priority + Status + Due Date */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="detail-priority">Priority</Label>
          <Select
            id="detail-priority"
            value={priority}
            onChange={(e) => draft.change({ priority: e.target.value as TaskPriority })}
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
            onChange={(e) => draft.change({ status: e.target.value as TaskStatus })}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="detail-due">Deadline</Label>
          <Input
            id="detail-due"
            type="date"
            value={value.dueDate ? value.dueDate.slice(0, 10) : ''}
            onChange={(e) =>
              draft.change({ dueDate: e.target.value ? `${e.target.value}T00:00:00.000Z` : null })
            }
          />
        </div>
      </div>

      {/* Planning */}
      <fieldset className="space-y-2 rounded-lg border border-border/70 p-3">
        <legend className="px-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          Planning
        </legend>
        <TaskPlanningFields
          idPrefix="detail"
          value={{
            plannedDate: value.plannedDate,
            estimatedMinutes: value.estimatedMinutes,
            effort: value.effort,
            context: value.context,
            projectId: value.projectId,
          }}
          onChange={(patch) => draft.change(patch)}
        />
      </fieldset>

      {/* Tags */}
      <div className="space-y-1">
        <Label htmlFor="detail-tags">Tags</Label>
        <Input
          id="detail-tags"
          value={tagsShown}
          onChange={(e) => {
            const raw = e.target.value
            setTagsEcho(raw)
            draft.change({
              tags: raw
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }}
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
                'rounded-md border px-3 py-2 text-left text-sm transition-colors',
                opt.color,
                quadrant === opt.value
                  ? 'ring-2 ring-ring ring-offset-1'
                  : 'opacity-60 hover:opacity-100'
              )}
              onClick={() => draft.change({ quadrant: quadrant === opt.value ? null : opt.value })}
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
          value={value.descriptionMd}
          onChange={(descriptionMd) => draft.change({ descriptionMd })}
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
            checked={value.isRecurring}
            onChange={(e) =>
              draft.change({
                isRecurring: e.target.checked,
                ...(!e.target.checked && { rrule: null }),
              })
            }
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="detail-recurring">Recurring task</Label>
        </div>
        {value.isRecurring && (
          <Select
            value={value.rrule ?? ''}
            onChange={(e) => draft.change({ rrule: e.target.value || null })}
            aria-label="Recurrence"
          >
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
    </div>
  )
}
