'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Archive,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Cloud,
  ExternalLink,
  Inbox as InboxIcon,
  RotateCcw,
  Sparkles,
  Undo2,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { StaggerBlock, StaggerGroup } from '@/components/motion'
import { CaptureProcessor } from '@/components/inbox/capture-processor'
import { useCaptureState, useInbox, useUndoCapture } from '@/hooks/use-inbox'
import { useToast } from '@/hooks/use-toast'
import { useCommandStore } from '@/stores/command-store'
import { captureDestination, type CaptureResponse, type CaptureState } from '@/lib/types/inbox'
import { cn } from '@/lib/utils'

type View = CaptureState

const VIEWS: { key: View; label: string }[] = [
  { key: 'inbox', label: 'To process' },
  { key: 'someday', label: 'Someday' },
  { key: 'processed', label: 'Processed' },
  { key: 'archived', label: 'Archived' },
]

const UNDO_MS = 8000

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.round(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export default function InboxPage() {
  const params = useSearchParams()
  const highlighted = params.get('capture')
  const [view, setView] = useState<View>('inbox')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [processing, setProcessing] = useState<CaptureResponse | null>(null)
  const [undo, setUndo] = useState<{ capture: CaptureResponse; label: string } | null>(null)
  const { data, isLoading } = useInbox({
    state: highlighted ? 'all' : view,
    search: search || undefined,
    page,
    pageSize: 30,
    ...(highlighted && { id: highlighted }),
  })
  const setState = useCaptureState()
  const undoCapture = useUndoCapture()
  const toast = useToast()
  const openCapture = useCommandStore((s) => s.openCapture)

  useEffect(() => setPage(1), [view, search])
  useEffect(() => {
    if (!undo) return
    const t = setTimeout(() => setUndo(null), UNDO_MS)
    return () => clearTimeout(t)
  }, [undo])

  const items = useMemo(() => data?.items ?? [], [data])
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / (data?.pageSize ?? 30)))

  const openNext = (after: CaptureResponse) => {
    const idx = items.findIndex((c) => c.id === after.id)
    const next = items.slice(idx + 1).find((c) => c.state === 'inbox') ?? null
    setProcessing(next)
  }

  const handleDone = (result: CaptureResponse) => {
    const label =
      result.state === 'someday'
        ? 'Moved to Someday'
        : `Saved as ${result.destinationType ?? 'item'}`
    setUndo({ capture: result, label })
    openNext(result)
  }

  const handleUndo = () => {
    if (!undo) return
    const target = undo.capture
    setUndo(null)
    undoCapture.mutate(target.id, {
      onSuccess: () => toast.show('Back in the inbox'),
      onError: () => toast.show('Could not undo', 'error'),
    })
  }

  return (
    <StaggerGroup className="mx-auto max-w-3xl space-y-5">
      <StaggerBlock>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <InboxIcon className="h-5 w-5 text-retro-blue" />
              <h1 className="font-display text-2xl font-bold text-retro-dark">Inbox</h1>
            </div>
            <p className="mt-1 font-mono text-sm text-retro-dark/60">
              Catch it now. Decide later. Nothing here is a commitment yet.
            </p>
          </div>
          <Button size="sm" onClick={() => openCapture({ kind: 'inbox' })} data-testid="inbox-capture">
            <Zap className="mr-1.5 h-3.5 w-3.5" />
            Capture
          </Button>
        </div>
      </StaggerBlock>

      <StaggerBlock>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-1 overflow-x-auto rounded-full bg-retro-dark/5 p-1" role="tablist">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                role="tab"
                aria-selected={view === v.key && !highlighted}
                onClick={() => setView(v.key)}
                className={cn(
                  'relative whitespace-nowrap rounded-full px-3 py-1.5 font-mono text-xs font-semibold transition-colors',
                  view === v.key && !highlighted
                    ? 'text-retro-dark'
                    : 'text-retro-dark/50 hover:text-retro-dark'
                )}
              >
                {view === v.key && !highlighted && (
                  <motion.span
                    layoutId="inbox-view"
                    className="absolute inset-0 rounded-full bg-background shadow-sm"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{v.label}</span>
              </button>
            ))}
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search captures…"
            aria-label="Search captures"
            className="sm:ml-auto sm:w-56"
          />
        </div>
      </StaggerBlock>

      {highlighted && (
        <StaggerBlock>
          <p className="font-mono text-xs text-retro-dark/60">
            Showing one capture.{' '}
            <Link href="/inbox" className="text-retro-blue underline">
              Back to the inbox
            </Link>
          </p>
        </StaggerBlock>
      )}

      <StaggerBlock>
        {isLoading ? (
          <div className="space-y-2" data-testid="inbox-loading">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="surface-outline rounded-2xl px-6 py-12 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-retro-mint" />
            <p className="mt-3 font-display text-lg font-semibold text-retro-dark">
              {view === 'inbox' && !search ? 'Inbox zero.' : 'Nothing here.'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {view === 'inbox' && !search
                ? 'Every thought has a home. Capture the next one with C.'
                : 'Try another view or clear the search.'}
            </p>
          </div>
        ) : (
          <ul className="surface-glass divide-y divide-border/60 overflow-hidden rounded-2xl">
            <AnimatePresence initial={false}>
              {items.map((c) => {
                const destination = captureDestination(c)
                return (
                  <motion.li
                    key={c.id}
                    layout
                    data-testid={`capture-${c.id}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                    className="group flex items-start gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm text-retro-dark">
                        {c.content}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-retro-dark/50">
                        <span>{timeAgo(c.createdAt)}</span>
                        {c.sourceUrl && (
                          <a
                            href={c.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-retro-blue hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {new URL(c.sourceUrl).hostname}
                          </a>
                        )}
                        {destination && (
                          <Link
                            href={destination}
                            className="inline-flex items-center gap-1 text-retro-blue hover:underline"
                          >
                            <ArrowRight className="h-3 w-3" />
                            Open {c.destinationType}
                          </Link>
                        )}
                        {c.state === 'someday' && (
                          <span className="inline-flex items-center gap-1">
                            <Cloud className="h-3 w-3" /> someday
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {c.state === 'inbox' || c.state === 'someday' ? (
                        <button
                          type="button"
                          data-testid={`process-open-${c.id}`}
                          onClick={() => setProcessing(c)}
                          className="flex h-8 items-center gap-1 rounded-full bg-retro-blue/10 px-3 font-mono text-xs font-bold text-retro-dark transition-colors hover:bg-retro-blue/20"
                        >
                          Process
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          aria-label="Back to inbox"
                          title="Back to inbox"
                          onClick={() => setState.mutate({ id: c.id, state: 'inbox' })}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-retro-dark/40 transition-colors hover:bg-retro-blue/10 hover:text-retro-blue"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {c.state !== 'archived' && (
                        <button
                          type="button"
                          aria-label="Archive"
                          title="Archive"
                          onClick={() => setState.mutate({ id: c.id, state: 'archived' })}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-retro-dark/40 transition-colors hover:bg-retro-dark/5 hover:text-retro-dark"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        )}
      </StaggerBlock>

      {totalPages > 1 && (
        <StaggerBlock>
          <nav
            aria-label="Inbox pages"
            className="flex items-center justify-between font-mono text-xs text-retro-dark/60"
          >
            <span>
              {total} capture{total === 1 ? '' : 's'}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!data?.hasMore}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </nav>
        </StaggerBlock>
      )}

      <Dialog
        open={processing !== null}
        onClose={() => setProcessing(null)}
        title="Process capture"
        description="Give it a home, or keep it as a someday."
        size="lg"
      >
        {processing && (
          <CaptureProcessor key={processing.id} capture={processing} onDone={handleDone} />
        )}
      </Dialog>

      <AnimatePresence>
        {undo && (
          <motion.div
            key="undo"
            data-testid="inbox-undo"
            role="status"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border-2 border-retro-dark bg-background px-4 py-2 shadow-hard lg:bottom-6"
          >
            <span className="font-mono text-xs text-retro-dark">{undo.label}</span>
            <button
              type="button"
              onClick={handleUndo}
              className="flex items-center gap-1 font-mono text-xs font-bold text-retro-blue hover:underline"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </StaggerGroup>
  )
}
