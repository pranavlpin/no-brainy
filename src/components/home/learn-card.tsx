'use client'

import Link from 'next/link'
import { BookOpen, Brain, Layers } from 'lucide-react'
import { Card, CardLabel } from '@/components/ui/card'
import { AnimatedNumber } from '@/components/motion/animated-number'
import type { HomeData } from '@/lib/types/home'

/** Cards due for review and books in progress, with one-tap entry points. */
export function LearnCard({ learn }: { learn: HomeData['learn'] }) {
  const topDeck = learn.decksDue[0]

  return (
    <Card data-testid="home-learn">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-retro-orange/15">
          <Brain className="h-4 w-4 text-retro-orange" />
        </span>
        <div>
          <CardLabel>Learn</CardLabel>
          <p className="text-sm font-medium text-retro-dark">Keep what you read</p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 rounded-xl bg-retro-orange/10 px-4 py-3">
        <div>
          <p className="font-display text-3xl font-bold text-retro-dark">
            <AnimatedNumber value={learn.cardsDue} data-testid="home-cards-due" />
          </p>
          <p className="font-mono text-[11px] uppercase tracking-wider text-retro-dark/50">
            cards due
          </p>
        </div>
        {topDeck ? (
          <Link
            href={`/flashcards/${topDeck.id}/review`}
            className="flex items-center gap-2 border-2 border-retro-dark bg-retro-orange px-3 py-1.5 font-mono text-xs font-bold text-white shadow-hard hover-shadow-grow"
            data-testid="home-review-cards"
          >
            <Layers className="h-3.5 w-3.5" />
            Review {topDeck.name.length > 18 ? `${topDeck.name.slice(0, 18)}…` : topDeck.name}
          </Link>
        ) : (
          <Link href="/flashcards" className="font-mono text-xs text-retro-blue hover:underline">
            All decks →
          </Link>
        )}
      </div>

      {learn.decksDue.length > 1 && (
        <ul className="mt-2 space-y-1 px-1">
          {learn.decksDue.slice(1, 4).map((d) => (
            <li key={d.id} className="flex items-center justify-between text-xs text-retro-dark/70">
              <Link href={`/flashcards/${d.id}/review`} className="truncate hover:underline">
                {d.name}
              </Link>
              <span className="font-mono">{d.dueCount}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 border-t border-border/60 pt-3">
        <CardLabel className="mb-1.5 px-1">Reading</CardLabel>
        {learn.reading.length === 0 ? (
          <Link
            href="/books"
            className="flex items-center gap-2 px-1 text-sm text-retro-dark/60 hover:text-retro-blue"
          >
            <BookOpen className="h-4 w-4" /> Pick a book to read next
          </Link>
        ) : (
          <ul className="space-y-2">
            {learn.reading.map((b) => {
              const pct =
                b.pagesTotal && b.pagesTotal > 0
                  ? Math.min(100, Math.round((b.pagesRead / b.pagesTotal) * 100))
                  : null
              return (
                <li key={b.id}>
                  <Link
                    href={`/books/${b.id}`}
                    className="block rounded-lg px-1 py-1 hover:bg-retro-blue/5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-retro-dark">
                        {b.title}
                      </span>
                      {pct != null && (
                        <span className="font-mono text-[11px] text-retro-dark/50">{pct}%</span>
                      )}
                    </div>
                    {pct != null && (
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-retro-dark/10">
                        <div
                          className="h-full rounded-full bg-retro-blue transition-[width] duration-500 ease-smooth"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Card>
  )
}
