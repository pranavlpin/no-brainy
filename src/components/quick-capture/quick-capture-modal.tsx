'use client'

import { useEffect, useRef, useState } from 'react'
import { Inbox, FileText, CheckSquare, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { useCreateCapture, useProcessCapture } from '@/hooks/use-inbox'
import { useToast } from '@/hooks/use-toast'
import { readCaptureDraft, writeCaptureDraft, type CaptureDraft } from '@/lib/inbox/drafts'

const memoryDrafts = new Map<string, CaptureDraft>()
const emptyDraft = (): CaptureDraft => ({
  content: '',
  requestId: crypto.randomUUID(),
  type: 'inbox',
  priority: 'medium',
  dueDate: '',
})
const storage = () => {
  try {
    return localStorage
  } catch {
    return undefined
  }
}

/** Capture is available from every workspace, including Focus, without requiring classification. */
export function QuickCaptureModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  if (!open) return null
  if (!user?.id)
    return (
      <Dialog open onClose={onClose} title="Quick capture">
        <p role="status" className="text-sm text-muted-foreground">
          Loading your personal workspace…
        </p>
      </Dialog>
    )
  return <CaptureEditor key={user.id} owner={user.id} onClose={onClose} />
}

function CaptureEditor({ owner, onClose }: { owner: string; onClose: () => void }) {
  const [draft, setDraft] = useState(
    () => memoryDrafts.get(owner) ?? readCaptureDraft(storage(), owner) ?? emptyDraft()
  )
  const [durable, setDurable] = useState(true)
  const initial = useRef(draft)
  useEffect(() => {
    setDurable(writeCaptureDraft(storage(), owner, initial.current))
  }, [owner])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [captured, setCaptured] = useState(false)
  const submitting = useRef(false)
  const create = useCreateCapture()
  const process = useProcessCapture()
  const toast = useToast()
  const persist = (next: CaptureDraft) => {
    memoryDrafts.set(owner, next)
    setDurable(writeCaptureDraft(storage(), owner, next))
    setDraft(next)
  }
  const submit = async () => {
    if (submitting.current || !draft.content.trim()) return
    submitting.current = true
    setPending(true)
    setError('')
    try {
      const capture = await create.mutateAsync({
        content: draft.content.trim(),
        clientRequestId: draft.requestId,
      })
      setCaptured(true)
      if (draft.type !== 'inbox')
        await process.mutateAsync({
          id: capture.id,
          kind: draft.type,
          priority: draft.priority,
          dueDate: draft.dueDate || null,
        })
      persist(emptyDraft())
      toast.show(
        draft.type === 'inbox'
          ? 'Saved to Inbox.'
          : `${draft.type === 'task' ? 'Task' : 'Note'} saved. Original kept in Inbox.`
      )
      onClose()
    } catch (failure) {
      const message =
        failure && typeof failure === 'object' && 'error' in failure
          ? (failure as { error?: { message?: string } }).error?.message
          : null
      setError(message ?? 'Could not finish saving. Your input is kept; retry when you are ready.')
    } finally {
      submitting.current = false
      setPending(false)
    }
  }
  return (
    <Dialog
      open
      onClose={() => {
        if (!submitting.current) onClose()
      }}
      title="Quick capture"
      description="Get it out of your head. Decide what it means later."
    >
      <div className="space-y-5">
        <textarea
          autoFocus
          aria-label="Capture text"
          data-testid="capture-input"
          value={draft.content}
          maxLength={30000}
          disabled={pending}
          onChange={(event) => persist({ ...draft, content: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void submit()
            }
          }}
          placeholder="A thought, a task, a useful link…"
          className="min-h-32 w-full resize-y rounded-2xl border border-border/70 bg-background/60 p-4 text-base leading-7 outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="flex flex-wrap gap-2" aria-label="Capture destination">
          {(
            [
              { type: 'inbox', label: 'Inbox', icon: Inbox },
              { type: 'task', label: 'Task', icon: CheckSquare },
              { type: 'note', label: 'Note', icon: FileText },
            ] as const
          ).map((item) => (
            <button
              key={item.type}
              type="button"
              aria-pressed={draft.type === item.type}
              disabled={pending}
              onClick={() => persist({ ...draft, type: item.type })}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors',
                draft.type === item.type
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
        {draft.type === 'task' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 text-sm">
              <label htmlFor="quick-capture-priority">Priority</label>
              <Select
                id="quick-capture-priority"
                value={draft.priority}
                disabled={pending}
                onChange={(event) =>
                  persist({ ...draft, priority: event.target.value as CaptureDraft['priority'] })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
            <label className="space-y-2 text-sm">
              Deadline
              <Input
                type="date"
                disabled={pending}
                value={draft.dueDate}
                onChange={(event) => persist({ ...draft, dueDate: event.target.value })}
              />
            </label>
          </div>
        )}
        <p role="status" className="text-xs leading-5 text-muted-foreground">
          {pending
            ? 'Saving…'
            : captured && error
              ? 'Original saved in Inbox. Finishing the destination is still pending.'
              : draft.content
                ? durable
                  ? 'Draft on this device · server save not yet confirmed'
                  : 'Device storage is unavailable. Your draft is in memory; keep this tab open and retry saving.'
                : 'Enter to save · Shift + Enter for a new line'}
        </p>
        {error && (
          <p role="alert" className="rounded-xl bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => {
              persist(emptyDraft())
              setError('')
              setCaptured(false)
            }}
          >
            Discard draft
          </Button>
          <Button
            data-testid="capture-save"
            disabled={pending || !draft.content.trim()}
            onClick={() => void submit()}
            className="gap-3"
          >
            {pending
              ? 'Saving…'
              : error
                ? 'Retry save'
                : draft.type === 'inbox'
                  ? 'Save to Inbox'
                  : `Create ${draft.type}`}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        {error && (
          <button
            className="text-xs text-primary underline"
            onClick={() => {
              persist({ ...draft, requestId: crypto.randomUUID() })
              setError('')
              setCaptured(false)
            }}
          >
            Keep this text as a new capture
          </button>
        )}
      </div>
    </Dialog>
  )
}
