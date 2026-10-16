'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGrowthSources } from '@/hooks/use-growth'
import type { GrowthSourceItem, GrowthSourceType } from '@/lib/types/growth'

interface GrowthSourcePickerProps {
  type: GrowthSourceType
  onChoose: (source: GrowthSourceItem) => void
}

/** Search owned sources page by page; nothing is fetched from outside. */
export function GrowthSourcePicker({ type, onChoose }: GrowthSourcePickerProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const query = useGrowthSources(type, search, page)
  return (
    <div className="space-y-2 rounded-xl border border-border/70 p-3">
      <Input
        aria-label="Search sources"
        placeholder="Find a source…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
      />
      {query.isLoading ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading sources…
        </p>
      ) : query.isError ? (
        <p role="alert" className="text-sm text-retro-pink">
          Could not load sources.{' '}
          <button type="button" className="underline" onClick={() => void query.refetch()}>
            Retry
          </button>
        </p>
      ) : (
        <>
          <ul className="max-h-44 space-y-0.5 overflow-y-auto">
            {query.data?.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  data-testid={`growth-source-${item.id}`}
                  className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-retro-dark hover:bg-retro-blue/10"
                  onClick={() => onChoose(item)}
                >
                  {item.title}
                </button>
              </li>
            ))}
            {!query.data?.items.length && (
              <li className="px-2 py-1.5 text-sm text-muted-foreground">Nothing matches yet.</li>
            )}
          </ul>
          {(page > 1 || query.data?.hasMore) && (
            <div className="flex justify-between">
              <Button type="button" size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button type="button" size="sm" variant="ghost" disabled={!query.data?.hasMore} onClick={() => setPage((p) => p + 1)}>
                More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
