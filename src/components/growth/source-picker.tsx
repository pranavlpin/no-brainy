'use client'
import { useState } from 'react'
import { useGrowthSources } from '@/hooks/use-growth'
import type { GrowthSourceType } from '@/lib/types/growth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
/** Search owned source pages without cutting the collection off at the first page. */
export function GrowthSourcePicker({
  type,
  onChoose,
}: {
  type: GrowthSourceType
  onChoose: (source: { id: string; title: string; observedAt?: string }) => void
}) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const query = useGrowthSources(type, search, page)
  return (
    <div className="space-y-3 rounded-xl border p-3">
      <Input
        aria-label="Search evidence sources"
        placeholder="Find a source…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
      />
      {query.isLoading ? (
        <p role="status" className="text-sm">
          Loading sources…
        </p>
      ) : query.isError ? (
        <div role="alert">
          Could not load sources.{' '}
          <Button variant="outline" onClick={() => query.refetch()}>
            Retry sources
          </Button>
        </div>
      ) : (
        <>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {query.data?.items.map((item) => (
              <button
                type="button"
                key={item.id}
                data-testid={`growth-source-${item.id}`}
                className="block w-full rounded-lg p-2 text-left text-sm hover:bg-muted focus-visible:outline-ring"
                aria-label={`Choose source ${item.title}`}
                onClick={() => onChoose(item)}
              >
                {item.title}
              </button>
            ))}
            {!query.data?.items.length && (
              <p className="text-sm text-muted-foreground">No matching sources yet.</p>
            )}
          </div>
          <div className="flex justify-between">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous sources
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={!query.data?.hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              More sources
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
