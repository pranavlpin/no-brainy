'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Clock3, Pencil, Plus, Trash2 } from 'lucide-react'
import { Card, CardLabel } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { TaskCheck } from '@/components/tasks/task-check'
import { TimeBlockForm } from '@/components/planner/time-block-form'
import { formatMinutes, planCapacity, timeMinutes } from '@/lib/planner/capacity'
import { cn } from '@/lib/utils'
import type { TimeBlock } from '@/lib/types/planner'

interface TimeBlocksProps {
  blocks: TimeBlock[]
  tasks: { id: string; title: string }[]
  onChange: (blocks: TimeBlock[]) => void
}

/** The day's time blocks, sorted by start, with overlap warnings and inline editing. */
export function TimeBlocks({ blocks, tasks, onChange }: TimeBlocksProps) {
  const [editing, setEditing] = useState<TimeBlock | 'new' | null>(null)
  const sorted = useMemo(
    () => [...blocks].sort((a, b) => timeMinutes(a.startTime) - timeMinutes(b.startTime)),
    [blocks]
  )
  const overlaps = useMemo(
    () =>
      new Set(
        planCapacity({ tasks: [], blocks, availableMinutes: 1440, bufferMinutes: 0 }).overlaps
      ),
    [blocks]
  )
  const titleOf = (id?: string) => tasks.find((t) => t.id === id)?.title

  const save = (block: TimeBlock) => {
    const exists = blocks.some((b) => b.id === block.id)
    onChange(exists ? blocks.map((b) => (b.id === block.id ? block : b)) : [...blocks, block])
    setEditing(null)
  }
  const remove = (id: string) => onChange(blocks.filter((b) => b.id !== id))
  const toggle = (id: string, isCompleted: boolean) =>
    onChange(blocks.map((b) => (b.id === id ? { ...b, isCompleted } : b)))

  return (
    <Card data-testid="time-blocks">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-retro-yellow/30">
          <Clock3 className="h-4 w-4 text-retro-dark" />
        </span>
        <div className="flex-1">
          <CardLabel>Time blocks</CardLabel>
          <p className="text-sm font-medium text-retro-dark">
            {sorted.length ? 'Where the hours actually go' : 'Give your focus a place in the day'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing('new')}
          data-testid="time-block-add"
          className="flex h-8 items-center gap-1 rounded-full bg-retro-blue/10 px-3 font-mono text-xs font-bold text-retro-dark transition-colors hover:bg-retro-blue/20"
        >
          <Plus className="h-3.5 w-3.5" />
          Block
        </button>
      </div>

      {sorted.length > 0 && (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {sorted.map((block) => {
              const overlapping = overlaps.has(block.id)
              const linked = titleOf(block.taskId)
              return (
                <motion.li
                  key={block.id}
                  layout
                  data-testid={`time-block-${block.id}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors',
                    block.isCompleted
                      ? 'border-retro-mint/40 bg-retro-mint/10'
                      : overlapping
                        ? 'border-retro-orange/50 bg-retro-orange/5'
                        : 'border-border/70 bg-background/60'
                  )}
                >
                  <TaskCheck
                    checked={block.isCompleted}
                    onChange={(next) => toggle(block.id, next)}
                    label={block.title}
                    size="sm"
                  />
                  <span className="w-[6.5rem] shrink-0 font-mono text-xs text-retro-dark/70">
                    {block.startTime}–{block.endTime}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate text-sm font-medium text-retro-dark',
                        block.isCompleted && 'text-muted-foreground line-through'
                      )}
                    >
                      {block.title}
                    </p>
                    {linked && (
                      <p className="truncate font-mono text-[11px] text-retro-dark/50">
                        for: {linked}
                      </p>
                    )}
                  </div>
                  <span className="hidden font-mono text-[11px] text-retro-dark/50 sm:inline">
                    {formatMinutes(timeMinutes(block.endTime) - timeMinutes(block.startTime))}
                  </span>
                  {overlapping && (
                    <span
                      role="status"
                      title="Overlaps another block"
                      className="text-retro-orange"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span className="sr-only">Overlaps another block</span>
                    </span>
                  )}
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      type="button"
                      aria-label={`Edit block "${block.title}"`}
                      onClick={() => setEditing(block)}
                      className="rounded-md p-1 text-retro-dark/40 hover:bg-retro-blue/10 hover:text-retro-blue"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete block "${block.title}"`}
                      onClick={() => remove(block.id)}
                      className="rounded-md p-1 text-retro-dark/40 hover:bg-retro-pink/10 hover:text-retro-pink"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' || !editing ? 'Add a time block' : 'Edit time block'}
        description="Blocks linked to a task count toward that task's time."
      >
        {editing !== null && (
          <TimeBlockForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? undefined : editing}
            tasks={tasks}
            onSave={save}
            onCancel={() => setEditing(null)}
          />
        )}
      </Dialog>
    </Card>
  )
}
