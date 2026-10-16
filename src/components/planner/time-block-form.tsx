'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { TimeBlock } from '@/lib/types/planner'
import type { TaskResponse } from '@/lib/types/tasks'

/** Keyboard-first block editing; overlap is a planning warning, invalid ordering is a field error. */
export function TimeBlockForm({
  initial,
  tasks,
  onSave,
}: {
  initial?: TimeBlock
  tasks: TaskResponse[]
  onSave: (block: TimeBlock) => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [start, setStart] = useState(initial?.startTime ?? '09:00')
  const [end, setEnd] = useState(initial?.endTime ?? '09:30')
  const [taskId, setTaskId] = useState(initial?.taskId ?? '')
  const [error, setError] = useState('')
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (start >= end) {
          setError('End time must be later than start time.')
          return
        }
        onSave({
          id: initial?.id ?? crypto.randomUUID(),
          title: title.trim(),
          startTime: start,
          endTime: end,
          ...(taskId && { taskId }),
          isCompleted: initial?.isCompleted ?? false,
          color: initial?.color,
        })
      }}
    >
      <div className="space-y-2">
        <label htmlFor="block-title" className="text-sm font-medium">
          Block title
        </label>
        <Input
          id="block-title"
          required
          maxLength={300}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Make room for focused work or a break"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label htmlFor="block-start" className="text-sm font-medium">
            Start time
          </label>
          <Input
            id="block-start"
            type="time"
            required
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="block-end" className="text-sm font-medium">
            End time
          </label>
          <Input
            id="block-end"
            type="time"
            required
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="block-task" className="text-sm font-medium">
          Linked action
        </label>
        <Select id="block-task" value={taskId} onChange={(event) => setTaskId(event.target.value)}>
          <option value="">No action — meeting, break or personal time</option>
          {initial?.taskId && !tasks.some((task) => task.id === initial.taskId) && (
            <option value={initial.taskId}>Previously linked action</option>
          )}
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </Select>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button className="w-full" type="submit" disabled={!title.trim()}>
        Save time block
      </Button>
    </form>
  )
}
