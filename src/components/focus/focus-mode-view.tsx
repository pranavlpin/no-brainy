'use client'
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowUpRight, Check, Leaf, Plus, X } from 'lucide-react'
import { useFocus } from '@/hooks/use-focus'
import { useUIStore } from '@/stores/ui-store'
import { useTask, useUpdateTask } from '@/hooks/use-tasks'
import { useTaskLinks } from '@/hooks/use-links'
import { useNote } from '@/hooks/use-notes'
import { timerLabel } from '@/lib/focus/clock'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
const MarkdownPreview = dynamic(() =>
  import('@/components/editor/markdown-preview').then((m) => m.MarkdownPreview)
)

function NoteReader({ id }: { id: string }) {
  const note = useNote(id)
  if (note.isLoading) return <p role="status">Loading note…</p>
  if (note.isError)
    return (
      <div role="alert">
        Could not load this note. <Button onClick={() => note.refetch()}>Retry</Button>
      </div>
    )
  return <MarkdownPreview content={note.data?.contentMd ?? ''} />
}

/** A quiet view over the persistent server session; closing this view never stops its clock. */
export function FocusModeView() {
  const focus = useFocus()
  const { focusTaskId, exitFocusMode } = useUIStore()
  const activeTaskId = focus.active?.taskId ?? focusTaskId
  const task = useTask(activeTaskId || undefined)
  const links = useTaskLinks(activeTaskId ?? '')
  const updateTask = useUpdateTask()
  const [finishing, setFinishing] = useState(false)
  const [note, setNote] = useState<{ id: string; title: string } | null>(null)
  const [contextError, setContextError] = useState('')
  const panel = useRef<HTMLElement>(null)
  const alerted = useRef<string | null>(null)
  const initialFocus = useRef<HTMLElement | null>(null)
  useEffect(() => {
    initialFocus.current = document.activeElement as HTMLElement
    panel.current?.focus()
    return () => {
      if (initialFocus.current?.isConnected) initialFocus.current.focus()
    }
  }, [])
  useEffect(() => {
    if (!focus.loading && !focus.active && !focus.pending && focus.setup.taskId !== focusTaskId)
      focus.setSetup({ taskId: focusTaskId, intention: '', reflection: '', nextAction: '' })
  }, [focus, focusTaskId])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]')) return
      if (event.key === 'Escape') {
        event.preventDefault()
        exitFocusMode()
        return
      }
      if (
        event.target instanceof Element &&
        event.target.closest('input,textarea,select,button,a,[contenteditable="true"]')
      )
        return
      if (
        event.code === 'Space' &&
        focus.active &&
        !focus.busy &&
        !focus.pending &&
        focus.remaining > 0
      ) {
        event.preventDefault()
        focus.command(focus.active.state === 'paused' ? 'resume' : 'pause')
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [focus, exitFocusMode])
  useEffect(() => {
    if (
      !focus.active ||
      focus.active.state !== 'running' ||
      focus.remaining > 0 ||
      alerted.current === focus.active.id
    )
      return
    alerted.current = focus.active.id
    if (!focus.setup.sound) return
    try {
      const ctx = new AudioContext()
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.value = 0.08
      oscillator.frequency.value = 660
      oscillator.start()
      oscillator.stop(ctx.currentTime + 0.25)
      oscillator.onended = () => {
        void ctx.close()
      }
    } catch {
      /* Optional sound is unavailable in some browsers. */
    }
  }, [focus.active, focus.remaining, focus.setup.sound])
  const active = focus.active
  const title = active?.taskTitle ?? task.data?.title ?? 'One thing at a time'
  const disabled = focus.busy || !!focus.pending || focus.offline
  const radius = 104
  const circumference = 2 * Math.PI * radius
  const fraction = active ? focus.remaining / active.plannedSeconds : 1
  const linkedNotes = links.data?.filter((link) => link.linkedType === 'note') ?? []
  return (
    <section
      ref={panel}
      tabIndex={-1}
      aria-label="Focus workspace"
      className="fixed inset-0 z-50 overflow-y-auto bg-background outline-none"
      data-testid={active ? `focus-session-${active.id}` : 'focus-setup'}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent"
      />
      <header className="relative flex items-center justify-between p-4 sm:p-6">
        <Button
          variant="outline"
          className="gap-2 bg-card/70"
          onClick={() => window.dispatchEvent(new Event('nobrainy:capture'))}
        >
          <Plus className="h-4 w-4" />
          Capture
        </Button>
        <span className="hidden items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground sm:flex">
          <Leaf className="h-4 w-4" />A little room to focus
        </span>
        <Button variant="ghost" size="icon" aria-label="Exit focus mode" onClick={exitFocusMode}>
          <X className="h-5 w-5" />
        </Button>
      </header>
      <div className="relative mx-auto max-w-xl space-y-6 px-5 pb-16 pt-2 sm:pt-6">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Your next small step</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {active?.intention && <p className="text-sm text-muted-foreground">{active.intention}</p>}
        </div>
        {focus.loading && (
          <p role="status" className="text-center">
            Recovering your session…
          </p>
        )}
        {!focus.durable && (
          <p role="status" className="rounded-xl border p-3 text-sm">
            Browser recovery storage is unavailable. Server-confirmed work is safe; keep this page
            open until pending input saves.
          </p>
        )}
        {(focus.pending || focus.error || focus.offline) && (
          <div
            role="alert"
            className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm"
          >
            <p>
              {focus.error ||
                (focus.pending
                  ? 'A session change is not yet confirmed. Your input is kept for retry.'
                  : 'Connection lost. Showing the last confirmed state.')}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button disabled={focus.busy} onClick={focus.retry}>
                {focus.busy ? 'Saving…' : 'Retry save / connection'}
              </Button>
              {focus.pending && (
                <Button
                  variant="outline"
                  disabled={focus.busy}
                  onClick={() => void focus.reconcile()}
                >
                  Use current server session
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Using the server session discards the pending command; your result draft stays
              available.
            </p>
          </div>
        )}
        {focus.result && !active ? (
          <div
            data-testid="focus-result"
            className="space-y-5 rounded-3xl border bg-card/80 p-7 text-center shadow-soft"
          >
            <Check className="mx-auto h-9 w-9 text-primary" />
            <h2 className="text-xl font-semibold">Result saved</h2>
            <p className="text-sm text-muted-foreground">
              {focus.result.outcome === 'completed'
                ? 'You completed this action.'
                : focus.result.outcome === 'blocked'
                  ? 'The obstacle is recorded. A smaller next step can wait until you are ready.'
                  : 'Your progress is recorded. The task stays open for the next step.'}
            </p>
            {focus.result.reflection && (
              <p className="whitespace-pre-wrap text-sm">{focus.result.reflection}</p>
            )}
            {focus.setup.breakReminder && (
              <p className="text-sm text-primary">
                A good moment to stand up, look away, or take a short break.
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={exitFocusMode}>Back to my day</Button>
              <Button
                variant="outline"
                onClick={() => {
                  focus.clearResult()
                  setFinishing(false)
                }}
              >
                Choose another session
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative mx-auto h-60 w-60">
              <svg viewBox="0 0 240 240" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-primary/10"
                />
                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - fraction)}
                  className="text-primary transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-5xl font-medium tabular-nums tracking-tight">
                  {timerLabel(active ? focus.remaining : focus.setup.minutes * 60)}
                </span>
                <span role="status" className="mt-3 text-sm text-muted-foreground">
                  {active
                    ? focus.remaining === 0
                      ? 'Time complete'
                      : active.state === 'paused'
                        ? 'Paused'
                        : 'Focus'
                    : 'Ready'}
                </span>
              </div>
            </div>
            {!active && !focus.loading && (
              <div className="space-y-4 rounded-3xl border bg-card/80 p-5 shadow-soft">
                <div className="flex gap-2">
                  {[25, 50].map((minutes) => (
                    <Button
                      key={minutes}
                      className="flex-1"
                      variant={focus.setup.minutes === minutes ? 'default' : 'outline'}
                      onClick={() => focus.setSetup({ minutes })}
                    >
                      {minutes} minutes
                    </Button>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-[110px_1fr]">
                  <div>
                    <label
                      htmlFor="focus-duration"
                      className="mb-1 block text-xs text-muted-foreground"
                    >
                      Custom minutes
                    </label>
                    <Input
                      id="focus-duration"
                      type="number"
                      min={1}
                      max={180}
                      value={focus.setup.minutes}
                      onChange={(e) =>
                        focus.setSetup({
                          minutes: Math.max(1, Math.min(180, Number(e.target.value) || 1)),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="focus-intention"
                      className="mb-1 block text-xs text-muted-foreground"
                    >
                      Session intention
                    </label>
                    <Input
                      id="focus-intention"
                      maxLength={1000}
                      placeholder="What would make this time useful?"
                      value={focus.setup.intention}
                      onChange={(e) => focus.setSetup({ intention: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={focus.setup.breakReminder}
                      onChange={(e) => focus.setSetup({ breakReminder: e.target.checked })}
                    />
                    Suggest a break afterward
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={focus.setup.sound}
                      onChange={(e) => focus.setSetup({ sound: e.target.checked })}
                    />
                    Gentle end sound
                  </label>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  disabled={
                    disabled ||
                    (!!focusTaskId && (task.isLoading || task.isError)) ||
                    (!!task.data && ['completed', 'cancelled'].includes(task.data.status))
                  }
                  onClick={() => focus.start(focusTaskId || null)}
                >
                  Start
                </Button>
                {task.data && ['completed', 'cancelled'].includes(task.data.status) && (
                  <p className="text-xs text-muted-foreground">
                    This task is finished. Reopen it from its task page to focus on it again.
                  </p>
                )}
              </div>
            )}
            {active && (
              <div className="space-y-4 text-center">
                <div className="flex justify-center gap-3">
                  {focus.remaining > 0 && (
                    <Button
                      size="lg"
                      variant="outline"
                      data-testid="focus-pause"
                      disabled={disabled}
                      onClick={() => focus.command(active.state === 'paused' ? 'resume' : 'pause')}
                    >
                      {active.state === 'paused' ? 'Resume' : 'Pause'}
                    </Button>
                  )}
                  <Button
                    size="lg"
                    data-testid="focus-finish"
                    disabled={disabled}
                    onClick={() => setFinishing(true)}
                  >
                    Finish session
                  </Button>
                </div>
                {focus.remaining === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Your chosen time is complete. Record what happened
                    {focus.setup.breakReminder ? ' and give yourself a short break' : ''}.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Closing Focus keeps your session. Nothing starts again automatically.
                </p>
              </div>
            )}
          </>
        )}
        {task.isError && (
          <p role="alert" className="text-center text-sm">
            Task context could not load.{' '}
            <Button variant="outline" onClick={() => task.refetch()}>
              Retry task
            </Button>
          </p>
        )}
        {((task.data?.subtasks?.length ?? 0) > 0 ||
          linkedNotes.length > 0 ||
          task.data?.descriptionMd) && (
          <details className="rounded-2xl border bg-card/70 p-4">
            <summary className="cursor-pointer text-sm font-medium">Notes & small steps</summary>
            <div className="mt-4 space-y-4">
              {task.data?.descriptionMd && (
                <p className="max-h-36 overflow-y-auto whitespace-pre-wrap text-sm text-muted-foreground">
                  {task.data.descriptionMd}
                </p>
              )}
              {task.data?.subtasks?.map((subtask) => (
                <label
                  key={subtask.id}
                  className="flex items-start gap-3 text-sm"
                  data-testid={`focus-subtask-${subtask.id}`}
                >
                  <input
                    className="mt-1"
                    type="checkbox"
                    checked={subtask.status === 'completed'}
                    disabled={updateTask.isPending}
                    onChange={async () => {
                      setContextError('')
                      try {
                        await updateTask.mutateAsync({
                          id: subtask.id,
                          data: {
                            status: subtask.status === 'completed' ? 'pending' : 'completed',
                          },
                        })
                      } catch {
                        setContextError('Could not save this step. Please retry.')
                      }
                    }}
                  />
                  {subtask.title}
                </label>
              ))}
              {linkedNotes.map((link) => (
                <Button
                  key={link.linkedId}
                  variant="outline"
                  className="mr-2 gap-2"
                  onClick={() => setNote({ id: link.linkedId, title: link.title || 'Linked note' })}
                >
                  {link.title || 'Linked note'}
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              ))}
              {contextError && (
                <p role="alert" className="text-sm text-destructive">
                  {contextError}
                </p>
              )}
            </div>
          </details>
        )}
      </div>
      <Dialog open={!!note} onClose={() => setNote(null)} title={note?.title ?? 'Linked note'}>
        {note && <NoteReader id={note.id} />}
      </Dialog>
      <Dialog
        open={finishing && !!active}
        onClose={() => {
          if (!focus.busy) setFinishing(false)
        }}
        title="What moved forward?"
        description="Choose what happened. Only Completed finishes the linked task."
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="focus-reflection" className="mb-1 block text-sm">
              Session result
            </label>
            <textarea
              id="focus-reflection"
              maxLength={10000}
              className="min-h-24 w-full rounded-xl border bg-background p-3 text-sm"
              placeholder="A result, an insight, or what got in the way (optional)"
              value={focus.setup.reflection}
              onChange={(e) => focus.setSetup({ reflection: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="focus-next" className="mb-1 block text-sm">
              Next action (optional)
            </label>
            <Input
              id="focus-next"
              maxLength={300}
              value={focus.setup.nextAction}
              onChange={(e) => focus.setSetup({ nextAction: e.target.value })}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                { value: 'completed', label: 'Completed' },
                { value: 'progress', label: 'Made progress' },
                { value: 'blocked', label: 'Blocked' },
              ] as const
            ).map((outcome) => (
              <Button
                key={outcome.value}
                disabled={disabled}
                variant={outcome.value === 'progress' ? 'default' : 'outline'}
                onClick={() =>
                  focus.command('finish', {
                    outcome: outcome.value,
                    reflection: focus.setup.reflection,
                    nextAction: focus.setup.nextAction,
                  })
                }
              >
                {outcome.label}
              </Button>
            ))}
          </div>
          {focus.error && (
            <p role="alert" className="text-sm text-destructive">
              {focus.error} Close this dialog to retry; your result stays here.
            </p>
          )}
        </div>
      </Dialog>
    </section>
  )
}
