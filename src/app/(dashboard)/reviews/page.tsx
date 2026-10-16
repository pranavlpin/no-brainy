'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useReviewPage } from '@/hooks/use-reviews'
import { Button } from '@/components/ui/button'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/ui/workspace-states'
export default function ReviewsPage() {
  const [page, setPage] = useState(1),
    query = useReviewPage(page)
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 py-8 sm:p-8">
      <PageHeader
        eyebrow="Perspective"
        title="Pause. Notice. Begin again."
        description="Your days are more than a checklist. Make a little room to see what helps."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/reviews/daily"
          className="surface-soft group p-7 transition-colors hover:border-primary/30"
        >
          <p className="eyebrow">A few quiet minutes</p>
          <h2 className="mt-4 text-2xl font-semibold">Close the day →</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            What moved forward, what got in the way, and one clear beginning for tomorrow.
          </p>
        </Link>
        <Link
          href="/reviews/weekly"
          className="surface group p-7 transition-colors hover:border-primary/30"
        >
          <p className="eyebrow">A wider view</p>
          <h2 className="mt-4 text-2xl font-semibold">Adjust the week →</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Keep what works. Try one small change. Choose a few outcomes that matter.
          </p>
        </Link>
      </div>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Your reflections</h2>
        {query.isLoading ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState retry={() => void query.refetch()} />
        ) : !query.data?.items.length ? (
          <EmptyState
            title="A place to find perspective"
            description="Your reflections will stay here. Start with one sentence whenever you’re ready."
          />
        ) : (
          <>
            <div className="space-y-3">
              {query.data.items.map((review) => (
                <Link
                  key={review.id}
                  href={`/reviews/daily?date=${review.reviewDate}`}
                  className="surface flex items-center justify-between gap-4 p-5 hover:border-primary/30"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{review.reviewDate}</p>
                    <p className="mt-2 truncate text-sm text-muted-foreground">
                      {review.whatMoved || review.reflectionMd || 'A little space to reflect'}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {review.closedAt ? 'Closed' : 'Draft'} →
                  </span>
                </Link>
              ))}
            </div>
            <nav
              aria-label="Reflection history pages"
              className="flex items-center justify-between"
            >
              <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous page
              </Button>
              <span className="text-xs text-muted-foreground">Page {page}</span>
              <Button
                variant="outline"
                disabled={!query.data.hasMore}
                onClick={() => setPage(page + 1)}
              >
                Next page
              </Button>
            </nav>
          </>
        )}
      </section>
    </div>
  )
}
