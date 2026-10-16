'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Inbox, Plus, Undo2 } from 'lucide-react'
import { useInbox, useCaptureState } from '@/hooks/use-inbox'
import { CaptureProcessor } from '@/components/inbox/capture-processor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/ui/workspace-states'
import { captureDestination, type CaptureResponse, type CaptureState } from '@/lib/types/inbox'

export default function InboxPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading Inbox" />}>
      <InboxContent />
    </Suspense>
  )
}

function InboxContent() {
  const params = useSearchParams()
  const router = useRouter()
  const requestedId = params.get('capture') ?? undefined
  const [state, setState] = useState<CaptureState | 'all'>('inbox')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<CaptureResponse | null>(null)
  const [lastProcessed, setLastProcessed] = useState<CaptureResponse | null>(null)
  const captures = useInbox({ state: requestedId ? 'all' : state, search, page, id: requestedId })
  const change = useCaptureState()
  const capture = () => window.dispatchEvent(new Event('nobrainy:capture'))
  const changeState = (id: string, next: 'inbox' | 'someday' | 'archived') =>
    change.mutate({ id, state: next })
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="A place for what’s on your mind"
        title="Inbox."
        description="Capture freely. Make one small decision at a time."
      >
        <Button className="gap-2" onClick={capture}>
          <Plus className="h-4 w-4" />
          Capture something
        </Button>
      </PageHeader>
      {lastProcessed && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-3"
        >
          <span className="text-sm">
            {lastProcessed.state === 'someday'
              ? 'Kept for Someday.'
              : `Saved as ${lastProcessed.destinationType}.`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={change.isPending}
            className="gap-2"
            onClick={() =>
              change.mutate(
                { id: lastProcessed.id, state: 'inbox' },
                { onSuccess: () => setLastProcessed(null) }
              )
            }
          >
            <Undo2 className="h-3.5 w-3.5" />
            Undo processing
          </Button>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Input
          aria-label="Search captures"
          placeholder="Find a thought or link…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          className="sm:max-w-sm"
        />
        <Select
          aria-label="Inbox view"
          value={requestedId ? 'all' : state}
          className="sm:w-44"
          onChange={(event) => {
            if (requestedId) router.replace('/inbox')
            setState(event.target.value as CaptureState | 'all')
            setPage(1)
          }}
        >
          <option value="inbox">To process</option>
          <option value="someday">Someday</option>
          <option value="processed">Processed</option>
          <option value="archived">Archived</option>
          <option value="all">All captures</option>
        </Select>
        {requestedId && (
          <Button variant="outline" onClick={() => router.replace('/inbox')}>
            Show all captures
          </Button>
        )}
      </div>
      {change.isError && (
        <p role="alert" className="text-sm text-destructive">
          Could not update this capture. Your original is safe; please try again.
        </p>
      )}
      {captures.isLoading ? (
        <LoadingState label="Loading Inbox" />
      ) : captures.isError ? (
        <ErrorState retry={() => void captures.refetch()} />
      ) : !captures.data?.items.length ? (
        <EmptyState
          title={state === 'inbox' ? 'A little more headspace.' : 'Nothing here yet.'}
          description={
            state === 'inbox'
              ? 'Your Inbox is clear. Capture whatever comes next, or give your attention to what matters today.'
              : 'Try another view or search to find an earlier thought.'
          }
          action="Capture a thought"
          onAction={capture}
        />
      ) : (
        <div className="space-y-4">
          {captures.data.items.map((item) => {
            const destination = captureDestination(item)
            return (
              <article
                key={item.id}
                data-testid={`capture-${item.id}`}
                className="surface p-5 sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="hidden rounded-2xl bg-secondary p-3 text-primary sm:block">
                    <Inbox className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <time dateTime={item.createdAt}>
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </time>
                      <span className="rounded-full bg-muted px-2 py-0.5 capitalize">
                        {item.state}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-7">
                      {item.content}
                    </p>
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-xs text-primary underline"
                      >
                        Original source
                      </a>
                    )}
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      {(item.state === 'inbox' || item.state === 'someday') && (
                        <Button
                          size="sm"
                          onClick={() => setSelected(item)}
                          className="gap-2"
                          aria-label="Process capture"
                        >
                          Process
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {destination && (
                        <Link
                          href={destination}
                          className="rounded-xl px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
                        >
                          Open {item.destinationType}
                        </Link>
                      )}
                      {item.state !== 'inbox' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={change.isPending}
                          onClick={() => changeState(item.id, 'inbox')}
                        >
                          Reopen capture
                        </Button>
                      )}
                      {item.state !== 'archived' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={change.isPending}
                          onClick={() => changeState(item.id, 'archived')}
                        >
                          Archive
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
      {captures.data && (
        <nav
          aria-label="Inbox pages"
          className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"
        >
          <span>
            {captures.data.total} captures · Page {page}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous page
            </Button>
            <Button
              variant="outline"
              disabled={!captures.data.hasMore}
              onClick={() => setPage((value) => value + 1)}
            >
              Next page
            </Button>
          </div>
        </nav>
      )}
      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Make room for the next step"
        description="Choose a home for this thought. The original always stays in Inbox."
      >
        {selected && (
          <CaptureProcessor
            key={selected.id}
            capture={selected}
            onDone={(result) => {
              setLastProcessed(result)
              setSelected(
                captures.data?.items.find(
                  (item) =>
                    item.id !== result.id && (item.state === 'inbox' || item.state === 'someday')
                ) ?? null
              )
            }}
          />
        )}
      </Dialog>
    </div>
  )
}
