'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { TimeBlock } from '@/lib/types/planner'

interface TimeBlockFormProps {
  initial?: TimeBlock
  /** Tasks a block may be linked to; linked time counts toward that task. */
  tasks: { id: string; title: string }[]
  onSave: (block: TimeBlock) => void
  onCancel?: () => void
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `blk_${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Keyboard-first block editing. An end before the start is a field error;
 * overlap with another block is a planning warning shown by the list, not
 * a reason to refuse the block.
 */
export function TimeBlockForm({ initial, tasks, onSave, onCancel }: TimeBlockFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [start, setStart] = useState(initial?.startTime ?? '09:00')
  const [end, setEnd] = useState(initial?.endTime ?? '09:30')
  const [taskId, setTaskId] = useState(initial?.taskId ?? '')
  const [error, setError] = useState('')

  return (
    <form
      data-testid="time-block-form"
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (!start || !end || start >= end) {
          setError('End time must be later than start time.')
          return
        }
        setError('')
        onSave({
          id: initial?.id ?? newId(),
          title: title.trim(),
          startTime: start,
          endTime: end,
          ...(taskId && { taskId }),
          isCompleted: initial?.isCompleted ?? false,
          ...(initial?.color && { color: initial.color }),
        })
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="block-title">Block title</Label>
        <Input
          id="block-title"
          required
          maxLength={300}
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Deep work, a meeting, a walk"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="block-start">Start time</Label>
          <Input
            id="block-start"
            type="time"
            required
            value={start}
            onChange={(event) => setStart(event.target.value)}
            className="font-mono"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="block-end">End time</Label>
          <Input
            id="block-end"
            type="time"
            required
            value={end}
            aria-invalid={!!error || undefined}
            onChange={(event) => {
              setEnd(event.target.value)
              setError('')
            }}
            className="font-mono"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="block-task">Linked task</Label>
        <Select id="block-task" value={taskId} onChange={(event) => setTaskId(event.target.value)}>
          <option value="">None. A meeting, a break, personal time</option>
          {initial?.taskId && !tasks.some((task) => task.id === initial.taskId) && (
            <option value={initial.taskId}>Previously linked task</option>
          )}
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </Select>
      </div>
      {error && (
        <p role="alert" className="text-sm text-retro-pink">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={!title.trim()}>
          {initial ? 'Save block' : 'Add block'}
        </Button>
      </div>
    </form>
  )
}
