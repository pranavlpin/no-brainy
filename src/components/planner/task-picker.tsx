'use client'

import { useState } from 'react'
import { useTaskPage } from '@/hooks/use-tasks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LoadingState, ErrorState } from '@/components/ui/workspace-states'
import type { TaskResponse } from '@/lib/types/tasks'

/** Search every active task with explicit paging, including undated actions. */
export function TaskPicker({
  onSelect,
  excludedIds = [],
}: {
  onSelect: (task: TaskResponse) => void
  excludedIds?: string[]
}) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const query = useTaskPage({
    status: 'active',
    search,
    page,
    pageSize: 20,
    sortBy: 'createdAt',
    sortOrder: 'asc',
  })
  const items = query.data?.items.filter((task) => !excludedIds.includes(task.id)) ?? []
  return (
    <div className="space-y-4">
      <Input
        autoFocus
        aria-label="Search active tasks"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value)
          setPage(1)
        }}
        placeholder="Find any active action…"
      />
      {query.isLoading ? (
        <LoadingState label="Loading active tasks" />
      ) : query.isError ? (
        <ErrorState retry={() => void query.refetch()} />
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {items.map((task) => (
            <button
              key={task.id}
              data-testid={`pick-task-${task.id}`}
              aria-label={`Choose ${task.title}`}
              className="flex w-full items-center justify-between gap-4 rounded-xl border p-3 text-left text-sm hover:border-primary/30 hover:bg-primary/5"
              onClick={() => onSelect(task)}
            >
              <span>{task.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {task.estimatedMinutes ? `${task.estimatedMinutes} min` : 'No estimate'}
              </span>
            </button>
          ))}
          {!items.length && (
            <p className="py-5 text-sm text-muted-foreground">
              No matching actions on this page. Try another search or page.
            </p>
          )}
        </div>
      )}
      {query.data && (
        <nav aria-label="Active task pages" className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous page
          </Button>
          <span className="text-xs text-muted-foreground">
            {page} / {Math.max(1, Math.ceil(query.data.total / query.data.pageSize))}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!query.data.hasMore}
            onClick={() => setPage((value) => value + 1)}
          >
            Next page
          </Button>
        </nav>
      )}
    </div>
  )
}
