'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, LayoutList, Grid2x2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { TaskList } from '@/components/tasks/task-list'
import { EisenhowerMatrix } from '@/components/tasks/eisenhower-matrix'
import { TaskForm } from '@/components/tasks/task-form'
import { TaskAIPanel } from '@/components/tasks/task-ai-panel'
import { PageHeader } from '@/components/ui/workspace-states'
import { useTaskPage, useCreateTask } from '@/hooks/use-tasks'
import { useUIStore } from '@/stores/ui-store'
import { filterByContext } from '@/lib/tasks/context'
import type { TaskPriority, CreateTaskRequest, TaskFilters } from '@/lib/types/tasks'

type ViewMode = 'list' | 'matrix'

const PAGE_SIZE = 20

export default function TasksPage() {
  const [view, setView] = useState<ViewMode>('list')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('')
  const [sortBy, setSortBy] = useState<string>('orderIndex:asc')
  const [showNewForm, setShowNewForm] = useState(false)

  const [sortField, sortOrder] = sortBy.split(':') as [string, 'asc' | 'desc']

  // Any filter change starts over from the first page.
  useEffect(() => {
    setPage(1)
  }, [search, showCompleted, priorityFilter, sortBy])

  const filters: TaskFilters = {
    ...(search && { search }),
    ...(!showCompleted && { status: 'active' as const }),
    ...(priorityFilter && { priority: priorityFilter as TaskPriority }),
    sortBy: sortField as TaskFilters['sortBy'],
    sortOrder,
    // The matrix needs the whole set; the list pages.
    page: view === 'matrix' ? 1 : page,
    pageSize: view === 'matrix' ? 100 : PAGE_SIZE,
  }

  const { data, isLoading } = useTaskPage(filters)
  const createTask = useCreateTask()
  const context = useUIStore((s) => s.context)

  // The top-bar context narrows the page; unclassified tasks always show.
  const tasks = filterByContext(data?.items ?? [], context)
  const total = data?.total ?? 0
  const pageSize = data?.pageSize ?? PAGE_SIZE
  const currentPage = data?.page ?? page
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasMore = data?.hasMore ?? false

  const handleCreate = (formData: CreateTaskRequest) => {
    createTask.mutate(formData, {
      onSuccess: () => {
        setShowNewForm(false)
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Do"
        title="Tasks"
        description={
          context === 'all'
            ? 'Everything with a next step. Plan a day, keep a deadline.'
            : `Showing ${context} tasks. Unclassified ones stay visible.`
        }
      >
        <TaskAIPanel />
        <button
          onClick={() => setShowNewForm(true)}
          className="border-2 border-retro-dark bg-retro-blue px-4 py-2 font-mono text-sm font-bold text-white shadow-hard hover-shadow-grow"
        >
          <Plus className="mr-2 inline h-4 w-4" />
          New Task
        </button>
      </PageHeader>

      {/* New task form */}
      {showNewForm && (
        <div className="rounded-lg border border-border bg-background p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">New Task</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowNewForm(false)}>
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
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
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
          <span className="font-mono text-xs text-retro-dark/60">
            Include completed and cancelled
          </span>
        </label>

        <div className="flex gap-1 sm:ml-auto">
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setView('list')}
            title="List view"
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'matrix' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setView('matrix')}
            title="Eisenhower Matrix view"
          >
            <Grid2x2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2" data-testid="tasks-loading">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : view === 'list' ? (
        <TaskList tasks={tasks} hideCompleted={!showCompleted} />
      ) : (
        <EisenhowerMatrix tasks={tasks} />
      )}

      {/* Pagination */}
      {view === 'list' && !isLoading && (total > pageSize || currentPage > 1) && (
        <nav
          aria-label="Task pages"
          className="flex items-center justify-between gap-3 font-mono text-xs text-retro-dark/60"
        >
          <span>
            {total} {total === 1 ? 'task' : 'tasks'}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              data-testid="task-prev-page"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
            </Button>
            <span aria-current="page">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              data-testid="task-next-page"
              disabled={!hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      )}
    </div>
  )
}
