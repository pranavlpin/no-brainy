'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { EvidenceForm } from '@/components/growth/evidence-form'
import { useDeleteEvidence, useGoalEvidence } from '@/hooks/use-growth'
import { formatDateKey } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { EvidenceKind, EvidenceResponse } from '@/lib/types/growth'

const KIND_TONE: Record<EvidenceKind, string> = {
  reflection: 'bg-retro-blue/10 text-retro-dark',
  practice: 'bg-retro-mint/20 text-retro-dark',
  rest: 'bg-retro-yellow/30 text-retro-dark',
  skip: 'bg-retro-dark/10 text-retro-dark/70',
}

interface EvidenceListProps {
  goalId: string
  today: string
  unit?: string | null
}

/** Dated observations, newest first, with versioned correction and removal. */
export function EvidenceList({ goalId, today, unit }: EvidenceListProps) {
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<EvidenceResponse | null>(null)
  const [removing, setRemoving] = useState<EvidenceResponse | null>(null)
  const query = useGoalEvidence(goalId, page)
  const remove = useDeleteEvidence()
  const items = query.data?.items ?? []

  return (
    <div data-testid="goal-evidence">
      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading evidence…</p>
      ) : items.length === 0 ? (
        <p className="surface-outline rounded-xl px-4 py-6 text-center text-sm text-muted-foreground">
          No evidence yet. The first observation is the hardest; log anything true.
        </p>
      ) : (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {items.map((e) => (
              <motion.li
                key={e.id}
                layout
                data-testid={`evidence-${e.id}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                className="group flex items-start gap-3 rounded-xl bg-background/70 px-3 py-2.5"
              >
                <div className="w-20 shrink-0 pt-0.5">
                  <p className="font-mono text-[11px] text-retro-dark/60">{formatDateKey(e.observedAt)}</p>
                  <span className={cn('mt-1 inline-block rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold', KIND_TONE[e.kind])}>
                    {e.kind}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap break-words text-sm text-retro-dark">{e.summary}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-retro-dark/50">
                    {e.measurement != null && (
                      <span>
                        {e.measurement}
                        {unit ? ` ${unit}` : ''}
                      </span>
                    )}
                    {e.sourceTitle &&
                      (e.sourceHref ? (
                        <Link href={e.sourceHref} className="inline-flex items-center gap-1 text-retro-blue hover:underline">
                          <ExternalLink className="h-3 w-3" />
                          {e.sourceTitle}
                        </Link>
                      ) : (
                        <span>{e.sourceTitle}</span>
                      ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button type="button" aria-label="Correct" onClick={() => setEditing(e)} className="rounded-md p-1 text-retro-dark/40 hover:bg-retro-blue/10 hover:text-retro-blue">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" aria-label="Remove" onClick={() => setRemoving(e)} className="rounded-md p-1 text-retro-dark/40 hover:bg-retro-pink/10 hover:text-retro-pink">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      {query.data && (query.data.hasMore || page > 1) && (
        <div className="mt-2 flex items-center justify-end gap-2 font-mono text-xs text-retro-dark/60">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>Page {page}</span>
          <Button variant="ghost" size="sm" disabled={!query.data.hasMore} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title="Correct this observation">
        {editing && (
          <EvidenceForm goalId={goalId} today={today} initial={editing} unit={unit} onSaved={() => setEditing(null)} />
        )}
      </Dialog>
      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove this evidence?"
        description="Only this observation is removed. The source stays."
        variant="destructive"
        confirmLabel="Remove"
        onConfirm={() => {
          if (removing) remove.mutate(removing.id, { onSettled: () => setRemoving(null) })
        }}
      />
    </div>
  )
}
