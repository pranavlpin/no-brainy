'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useCreateNote } from '@/hooks/use-notes'
import { useCreateTask } from '@/hooks/use-tasks'
import { useToast } from '@/hooks/use-toast'
import type { TaskPriority } from '@/lib/types/tasks'

type CaptureType = 'note' | 'task'

const priorities: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

interface QuickCaptureModalProps {
  open: boolean
  onClose: () => void
}

export function QuickCaptureModal({ open, onClose }: QuickCaptureModalProps) {
  const [type, setType] = useState<CaptureType>('note')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const submitting = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const createNote = useCreateNote()
  const createTask = useCreateTask()
  const toast = useToast()

  const reset = useCallback(() => {
    setContent('')
    setType('note')
    setPriority('medium')
    setDueDate('')
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [onClose, reset])

  useEffect(() => {
    if (open) {
      // Small delay to allow the modal to render before focusing
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim()
    if (!trimmed || submitting.current) return
    submitting.current = true

    try {
      if (type === 'note') {
        await createNote.mutateAsync({ title: trimmed })
        toast.show('Note created!')
      } else {
        await createTask.mutateAsync({
          title: trimmed,
          priority,
          dueDate: dueDate || undefined,
        })
        toast.show('Task created!')
      }
      handleClose()
    } catch {
      toast.show('Failed to create. Please try again.', 'error')
    } finally {
      submitting.current = false
    }
  }, [content, type, priority, dueDate, createNote, createTask, toast, handleClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  if (!open) return null

  const isSubmitting = createNote.isPending || createTask.isPending

  return (
    <Dialog open={open} onClose={handleClose} title="Quick capture">
      {/* Input */}
      <input
        ref={inputRef}
        autoFocus
        aria-label="Capture text"
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Quick capture... (note or task)"
        className="w-full border-0 bg-transparent text-lg font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
        disabled={isSubmitting}
      />

      <div className="mt-4 flex flex-col gap-4">
        {/* Type toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Type:</span>
          <div className="flex rounded-lg bg-muted p-0.5">
            <button
              type="button"
              onClick={() => setType('note')}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                type === 'note'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Note
            </button>
            <button
              type="button"
              onClick={() => setType('task')}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                type === 'task'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Task
            </button>
          </div>
        </div>

        {/* Task-specific fields */}
        {type === 'task' && (
          <div className="flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Priority */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Priority:</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="rounded-md border border-border bg-popover px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {priorities.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Due:</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-md border border-border bg-popover px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">
            Press{' '}
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-mono">
              Enter
            </kbd>{' '}
            to submit,{' '}
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-mono">
              Esc
            </kbd>{' '}
            to close
          </p>
          <Button size="sm" onClick={handleSubmit} disabled={!content.trim() || isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
