'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, CheckSquare, FileText, Flag, Hash, Target, Zap } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useCreateNote } from '@/hooks/use-notes'
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

/**
 * Natural-language capture. Type one line; dates, #tags, !priority and
 * @goal become chips as you go. Enter saves, Tab flips task/note.
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
  const toast = useToast()

  useEffect(() => {
    if (open) {
      setText(seed)
      setKindOverride(initialKind === 'note' ? 'note' : null)
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
  const isSubmitting = createTask.isPending || createNote.isPending
  const canSubmit = parsed.title.length > 0 && !isSubmitting

  const submit = async () => {
    if (!canSubmit) return
    try {
      if (kind === 'note') {
        await createNote.mutateAsync({ title: parsed.title })
        toast.show('Note captured')
      } else {
        await createTask.mutateAsync({
          title: parsed.title,
          dueDate: parsed.dueDate,
          tags: parsed.tags,
          priority: parsed.priority,
          goalId: parsed.goalId,
        })
        toast.show(
          parsed.dueLabel ? `Task added for ${parsed.dueLabel.toLowerCase()}` : 'Task added'
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
            onClick={() => setKindOverride(kind === 'task' ? 'note' : 'task')}
            data-testid="capture-chip-kind"
            aria-label={`Capturing a ${kind}; press to switch`}
            className={cn(
              'flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 font-mono text-xs font-bold transition-colors',
              kind === 'task'
                ? 'border-retro-blue/40 bg-retro-blue/10 text-retro-blue'
                : 'border-retro-mint/50 bg-retro-mint/15 text-retro-dark'
            )}
          >
            {kind === 'task' ? (
              <CheckSquare className="h-3.5 w-3.5" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            {kind === 'task' ? 'Task' : 'Note'}
          </button>
          <input
            ref={inputRef}
            data-testid="capture-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void submit()
              } else if (e.key === 'Tab') {
                e.preventDefault()
                setKindOverride(kind === 'task' ? 'note' : 'task')
              }
            }}
            placeholder={
              kind === 'task'
                ? 'Call bank tomorrow #finance !high @Goal'
                : 'A thought worth keeping…'
            }
            disabled={isSubmitting}
            className="h-11 w-full border-0 border-b-2 border-retro-dark/15 bg-transparent text-lg font-medium text-retro-dark placeholder:text-retro-dark/30 focus:border-retro-blue focus:outline-none"
          />
        </div>

        <div className="mt-3 flex min-h-[28px] flex-wrap items-center gap-1.5">
          <AnimatePresence initial={false}>
            {kind === 'task' && parsed.dueLabel && (
              <Chip key="date" icon={CalendarDays} tone="blue" data-testid="capture-chip-date">
                {parsed.dueLabel}
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
            {parsed.tags.map((t) => (
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
          {text.trim().length === 0 && (
            <span className="font-mono text-[11px] text-retro-dark/40">
              dates · #tags · !priority · @goal · “note:” prefix
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
          <p className="font-mono text-[11px] text-retro-dark/40">
            <kbd className="rounded border border-retro-dark/15 px-1">Enter</kbd> save ·{' '}
            <kbd className="rounded border border-retro-dark/15 px-1">Tab</kbd> task/note ·{' '}
            <kbd className="rounded border border-retro-dark/15 px-1">Esc</kbd> close
          </p>
          <Button
            size="sm"
            onClick={() => void submit()}
            disabled={!canSubmit}
            data-testid="capture-submit"
          >
            <Zap className="mr-1.5 h-3.5 w-3.5" />
            {isSubmitting ? 'Saving…' : kind === 'task' ? 'Add task' : 'Save note'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
