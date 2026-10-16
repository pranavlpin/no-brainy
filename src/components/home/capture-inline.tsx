'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { useCreateTask } from '@/hooks/use-tasks'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface CaptureInlineProps {
  today: string
  className?: string
}

/** One-line task capture that plans the task for today. */
export function CaptureInline({ today, className }: CaptureInlineProps) {
  const [title, setTitle] = useState('')
  const createTask = useCreateTask()
  const toast = useToast()

  const submit = () => {
    const trimmed = title.trim()
    if (!trimmed || createTask.isPending) return
    createTask.mutate(
      { title: trimmed, plannedDate: today },
      {
        onSuccess: () => {
          setTitle('')
          toast.show('Added to today')
        },
        onError: () => toast.show('Could not add the task', 'error'),
      }
    )
  }

  return (
    <form
      data-testid="home-capture"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className={cn(
        'surface-glass flex items-center gap-2 rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-retro-blue/40',
        className
      )}
    >
      <Plus className="h-4 w-4 shrink-0 text-retro-dark/40" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add something for today… (press Enter)"
        aria-label="Quick add a task for today"
        data-testid="home-capture-input"
        className="min-w-0 flex-1 bg-transparent text-sm text-retro-dark placeholder:text-retro-dark/40 focus:outline-none"
      />
      <button
        type="submit"
        disabled={!title.trim() || createTask.isPending}
        className="rounded-full bg-retro-blue px-3 py-1 font-mono text-xs font-bold text-white transition-opacity disabled:opacity-40"
      >
        {createTask.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add'}
      </button>
    </form>
  )
}
