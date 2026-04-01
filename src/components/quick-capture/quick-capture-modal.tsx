'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
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

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, handleClose])

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim()
    if (!trimmed) return

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
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 animate-in fade-in duration-150"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-[61] w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Quick capture... (note or task)"
          className="w-full border-0 bg-transparent text-lg font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
          disabled={isSubmitting}
        />

        <div className="mt-4 flex flex-col gap-4">
          {/* Type toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Type:</span>
            <div className="flex rounded-lg bg-gray-100 p-0.5">
              <button
                type="button"
                onClick={() => setType('note')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  type === 'note'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
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
                    : 'text-gray-600 hover:text-gray-900'
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
                <span className="text-sm text-gray-500">Priority:</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <span className="text-sm text-gray-500">Due:</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-400">
              Press <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 text-[10px] font-mono">Enter</kbd> to submit,{' '}
              <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 text-[10px] font-mono">Esc</kbd> to close
            </p>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
