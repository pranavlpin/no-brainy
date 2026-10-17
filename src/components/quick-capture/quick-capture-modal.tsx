'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, CheckSquare, FileText, Flag, Hash, Inbox, Target, Zap } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useCreateNote } from '@/hooks/use-notes'
import { useCreateCapture } from '@/hooks/use-inbox'
import { useCreateTask } from '@/hooks/use-tasks'
import { useGoals } from '@/hooks/use-goals'
import { useToast } from '@/hooks/use-toast'
import { useUserToday } from '@/hooks/use-user-today'
import { parseCapture, type CaptureKind } from '@/lib/capture/parse'
import { cn } from '@/lib/utils'

interface QuickCaptureModalProps {
  open: boolean
  onClose: () => void
  initialKind?: CaptureKind
  seed?: string
}

const PRIORITY_LABEL = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' } as const

function Chip({
  icon: Icon,
  tone,
  children,
  ...rest
}: {
  icon: typeof Hash
  tone: 'blue' | 'pink' | 'mint' | 'yellow' | 'orange'
  children: React.ReactNode
  'data-testid'?: string
}) {
  const tones = {
    blue: 'bg-retro-blue/10 text-retro-blue border-retro-blue/30',
    pink: 'bg-retro-pink/10 text-retro-pink border-retro-pink/30',
    mint: 'bg-retro-mint/15 text-retro-dark border-retro-mint/40',
    yellow: 'bg-retro-yellow/25 text-retro-dark border-retro-yellow/60',
    orange: 'bg-retro-orange/15 text-retro-dark border-retro-orange/40',
  }
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 520, damping: 30 }}
      data-testid={rest['data-testid']}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] font-semibold',
        tones[tone]
      )}
    >
      <Icon className="h-3 w-3" />
      {children}
    </motion.span>
  )
}

const KIND_ORDER: CaptureKind[] = ['task', 'note', 'inbox']
const nextKind = (k: CaptureKind): CaptureKind =>
  KIND_ORDER[(KIND_ORDER.indexOf(k) + 1) % KIND_ORDER.length]

function newRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(16)}-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/**
 * Natural-language capture. Type one line; dates, #tags, !priority and
 * @goal become chips as you go. Enter saves, Tab cycles task / note / inbox,
 * Shift+Enter drops the raw text into the Inbox to process later.
 */
export function QuickCaptureModal({
  open,
  onClose,
  initialKind = 'task',
  seed = '',
}: QuickCaptureModalProps) {
  const [text, setText] = useState(seed)
  const [kindOverride, setKindOverride] = useState<CaptureKind | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { today } = useUserToday()
  const { data: goals } = useGoals({ status: 'active' })
  const createTask = useCreateTask()
  const createNote = useCreateNote()
  const createCapture = useCreateCapture()
  const toast = useToast()
  // One request id per modal session so a retried save never duplicates.
  const requestId = useRef(newRequestId())

  useEffect(() => {
    if (open) {
      setText(seed)
      setKindOverride(initialKind === 'task' ? null : initialKind)
      requestId.current = newRequestId()
      const t = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [open, seed, initialKind])

  const parsed = useMemo(
    () =>
      parseCapture(text, {
        today,
        goals: (goals ?? []).map((g) => ({ id: g.id, title: g.title })),
      }),
    [text, today, goals]
  )
  const kind: CaptureKind = kindOverride ?? parsed.kind
  const isSubmitting = createTask.isPending || createNote.isPending || createCapture.isPending
  const rawText = text.replace(/^(note|task|inbox)\s*:\s*/i, '').trim()
  const canSubmit =
    (kind === 'inbox' ? rawText.length > 0 : parsed.title.length > 0) && !isSubmitting

  const submit = async (destination: CaptureKind = kind) => {
    const target = destination
    if (isSubmitting) return
    if (target === 'inbox' ? rawText.length === 0 : parsed.title.length === 0) return
    try {
      if (target === 'inbox') {
        await createCapture.mutateAsync({ content: rawText, clientRequestId: requestId.current })
        toast.show('Saved to Inbox')
      } else if (target === 'note') {
        await createNote.mutateAsync({ title: parsed.title })
        toast.show('Note captured')
      } else {
        await createTask.mutateAsync({
          title: parsed.title,
          plannedDate: parsed.plannedDate,
          dueDate: parsed.dueDate,
          tags: parsed.tags,
          priority: parsed.priority,
          goalId: parsed.goalId,
        })
        toast.show(
          parsed.dateLabel
            ? parsed.dueDate
              ? `Task due by ${parsed.dateLabel.toLowerCase()}`
              : `Task planned for ${parsed.dateLabel.toLowerCase()}`
            : 'Task added'
        )
      }
      setText('')
      onClose()
    } catch {
      toast.show('Could not save. Try again.', 'error')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Capture" size="lg" hideClose>
      <div className="-mt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setKindOverride(nextKind(kind))}
            data-testid="capture-chip-kind"
            aria-label={`Saving as ${kind === 'inbox' ? 'an inbox item' : `a ${kind}`}; press to switch`}
            className={cn(
              'flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 font-mono text-xs font-bold transition-colors',
              kind === 'task' && 'border-retro-blue/40 bg-retro-blue/10 text-retro-blue',
              kind === 'note' && 'border-retro-mint/50 bg-retro-mint/15 text-retro-dark',
              kind === 'inbox' && 'border-retro-yellow/70 bg-retro-yellow/25 text-retro-dark'
            )}
          >
            {kind === 'task' ? (
              <CheckSquare className="h-3.5 w-3.5" />
            ) : kind === 'note' ? (
              <FileText className="h-3.5 w-3.5" />
            ) : (
              <Inbox className="h-3.5 w-3.5" />
            )}
            {kind === 'task' ? 'Task' : kind === 'note' ? 'Note' : 'Inbox'}
          </button>
          <input
            ref={inputRef}
            data-testid="capture-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault()
                void submit('inbox')
              } else if (e.key === 'Enter') {
                e.preventDefault()
                void submit()
              } else if (e.key === 'Tab') {
                e.preventDefault()
                setKindOverride(nextKind(kind))
              }
            }}
            placeholder={
              kind === 'task'
                ? 'Call bank tomorrow #finance !high @Goal'
                : kind === 'note'
                  ? 'A thought worth keeping…'
                  : 'Anything. Sort it out later.'
            }
            disabled={isSubmitting}
            className="h-11 w-full border-0 border-b-2 border-retro-dark/15 bg-transparent text-lg font-medium text-retro-dark placeholder:text-retro-dark/30 focus:border-retro-blue focus:outline-none"
          />
        </div>

        <div className="mt-3 flex min-h-[28px] flex-wrap items-center gap-1.5">
          <AnimatePresence initial={false}>
            {kind === 'task' && parsed.dateLabel && (
              <Chip
                key="date"
                icon={parsed.dueDate ? Flag : CalendarDays}
                tone={parsed.dueDate ? 'orange' : 'blue'}
                data-testid="capture-chip-date"
              >
                {parsed.dueDate ? `By ${parsed.dateLabel}` : parsed.dateLabel}
              </Chip>
            )}
            {kind === 'task' && parsed.priority && (
              <Chip key="priority" icon={Flag} tone="pink" data-testid="capture-chip-priority">
                {PRIORITY_LABEL[parsed.priority]}
              </Chip>
            )}
            {kind === 'task' && parsed.goalTitle && (
              <Chip key="goal" icon={Target} tone="mint" data-testid="capture-chip-goal">
                {parsed.goalTitle}
              </Chip>
            )}
            {kind === 'task' && parsed.goalQuery && !parsed.goalTitle && (
              <Chip
                key="goal-miss"
                icon={Target}
                tone="orange"
                data-testid="capture-chip-goal-miss"
              >
                no goal “{parsed.goalQuery}”
              </Chip>
            )}
            {kind !== 'inbox' &&
              parsed.tags.map((t) => (
                <Chip
                  key={`tag-${t}`}
                  icon={Hash}
                  tone="yellow"
                  data-testid={`capture-chip-tag-${t}`}
                >
                  {t}
                </Chip>
              ))}
          </AnimatePresence>
          {kind === 'inbox' && text.trim().length > 0 && (
            <span className="font-mono text-[11px] text-retro-dark/50">
              Saved exactly as typed. Process it from the Inbox.
            </span>
          )}
          {text.trim().length === 0 && (
            <span className="font-mono text-[11px] text-retro-dark/40">
              dates · #tags · !priority · @goal · “note:” or “inbox:” prefix
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
          <p className="font-mono text-[11px] text-retro-dark/40">
            <kbd className="rounded border border-retro-dark/15 px-1">Enter</kbd> save ·{' '}
            <kbd className="rounded border border-retro-dark/15 px-1">Shift+Enter</kbd> inbox ·{' '}
            <kbd className="rounded border border-retro-dark/15 px-1">Tab</kbd> switch ·{' '}
            <kbd className="rounded border border-retro-dark/15 px-1">Esc</kbd> close
          </p>
          <Button
            size="sm"
            onClick={() => void submit()}
            disabled={!canSubmit}
            data-testid="capture-submit"
          >
            <Zap className="mr-1.5 h-3.5 w-3.5" />
            {isSubmitting
              ? 'Saving…'
              : kind === 'task'
                ? 'Add task'
                : kind === 'note'
                  ? 'Save note'
                  : 'Save to Inbox'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
