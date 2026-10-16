'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Bookmark, CheckSquare, Cloud, ExternalLink, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useProcessCapture } from '@/hooks/use-inbox'
import { useUserToday } from '@/hooks/use-user-today'
import { addDays } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { captureDestination, type CaptureResponse, type ProcessKind } from '@/lib/types/inbox'
import type { TaskPriority } from '@/lib/types/tasks'

interface CaptureProcessorProps {
  capture: CaptureResponse
  onDone: (capture: CaptureResponse) => void
}

const KINDS: { value: ProcessKind; label: string; hint: string; icon: typeof CheckSquare }[] = [
  { value: 'task', label: 'Task', hint: 'Something to do', icon: CheckSquare },
  { value: 'note', label: 'Note', hint: 'Something to keep', icon: FileText },
  { value: 'bookmark', label: 'Bookmark', hint: 'A link to return to', icon: Bookmark },
  { value: 'someday', label: 'Someday', hint: 'A possibility, no commitment', icon: Cloud },
]

/**
 * Process one capture into its destination. Errors keep the form values so
 * nothing typed is lost; Save & next is keyboard reachable.
 */
export function CaptureProcessor({ capture, onDone }: CaptureProcessorProps) {
  const { today } = useUserToday()
  const [kind, setKind] = useState<ProcessKind>('task')
  const [title, setTitle] = useState(capture.content.split('\n')[0].trim().slice(0, 200))
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [plannedDate, setPlannedDate] = useState('')
  const [url, setUrl] = useState(capture.sourceUrl ?? '')
  const [error, setError] = useState('')
  const lock = useRef(false)
  const process = useProcessCapture()
  const destination = captureDestination(capture)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (lock.current) return
    lock.current = true
    setError('')
    try {
      const result = await process.mutateAsync({
        id: capture.id,
        kind,
        ...(kind !== 'someday' && { title: title.trim() || undefined }),
        ...(kind === 'task' && { priority, plannedDate: plannedDate || null }),
        ...(kind === 'bookmark' && { url }),
      })
      onDone(result)
    } catch (err) {
      const message =
        typeof err === 'object' && err && 'error' in err
          ? (err as { error?: { message?: string } }).error?.message
          : undefined
      setError(message ?? 'Could not finish. Your original and your choices are kept; try again.')
    } finally {
      lock.current = false
    }
  }

  const tomorrow = addDays(today, 1)

  return (
    <form className="space-y-4" data-testid={`process-${capture.id}`} onSubmit={(e) => void submit(e)}>
      <div className="surface-solid rounded-xl p-3">
        <p className="font-mono text-[11px] uppercase tracking-wide text-retro-dark/50">Original</p>
        <p className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-6 text-retro-dark">
          {capture.content}
        </p>
        {capture.sourceUrl && (
          <a
            href={capture.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 font-mono text-xs text-retro-blue hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Open source
          </a>
        )}
      </div>

      {destination ? (
        <div className="rounded-xl border border-retro-blue/30 bg-retro-blue/5 p-3 text-sm leading-6">
          This capture already became a {capture.destinationType}. Processing again keeps it.{' '}
          <Link className="text-retro-blue underline" href={destination}>
            Open it
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-1">
            <Label>Save as</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Save as">
              {KINDS.map((k) => {
                const active = kind === k.value
                return (
                  <button
                    key={k.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={k.label}
                    title={k.hint}
                    onClick={() => setKind(k.value)}
                    className={cn(
                      'flex flex-col items-start gap-0.5 rounded-xl border p-2.5 text-left transition-colors',
                      active
                        ? 'border-retro-dark bg-retro-yellow/30'
                        : 'border-border/70 hover:border-retro-dark/40'
                    )}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-retro-dark">
                      <k.icon className="h-3.5 w-3.5" />
                      {k.label}
                    </span>
                    <span className="font-mono text-[10px] text-retro-dark/50">{k.hint}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {kind !== 'someday' && (
            <div className="space-y-1">
              <Label htmlFor="capture-title">Title</Label>
              <Input
                id="capture-title"
                value={title}
                maxLength={500}
                required
                onChange={(e) => setTitle(e.target.value)}
                disabled={process.isPending}
              />
            </div>
          )}

          {kind === 'task' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="capture-priority">Priority</Label>
                <Select
                  id="capture-priority"
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
                <Label htmlFor="capture-planned">Planned for</Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    id="capture-planned"
                    type="date"
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setPlannedDate(plannedDate === today ? '' : today)}
                    className={cn(
                      'shrink-0 rounded-full border px-2 py-1 font-mono text-[11px]',
                      plannedDate === today ? 'border-retro-dark bg-retro-dark text-white' : 'border-border'
                    )}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlannedDate(plannedDate === tomorrow ? '' : tomorrow)}
                    className={cn(
                      'shrink-0 rounded-full border px-2 py-1 font-mono text-[11px]',
                      plannedDate === tomorrow ? 'border-retro-dark bg-retro-dark text-white' : 'border-border'
                    )}
                  >
                    Tomorrow
                  </button>
                </div>
              </div>
            </div>
          )}

          {kind === 'bookmark' && (
            <div className="space-y-1">
              <Label htmlFor="capture-url">URL</Label>
              <Input
                id="capture-url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          )}

          {kind === 'someday' && (
            <p className="text-sm leading-6 text-muted-foreground">
              Keep the possibility without adding a commitment. It waits under Someday until you
              want it.
            </p>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="text-sm text-retro-pink">
          {error}
        </p>
      )}

      <Button type="submit" disabled={process.isPending} className="w-full">
        {process.isPending ? 'Saving…' : 'Save & next'}
      </Button>
    </form>
  )
}
