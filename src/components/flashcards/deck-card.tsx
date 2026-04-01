'use client'

import { Layers, Play, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { DeckResponse } from '@/lib/types/flashcards'

interface DeckCardProps {
  deck: DeckResponse
  onOpen: (id: string) => void
  onReview: (id: string) => void
}

export function DeckCard({ deck, onOpen, onReview }: DeckCardProps) {
  const hasDue = (deck.dueCount ?? 0) > 0

  return (
    <div
      className="group flex flex-col rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md cursor-pointer"
      onClick={() => onOpen(deck.id)}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-foreground line-clamp-1">
          {deck.name}
        </h3>
        {hasDue && (
          <Badge variant="orange" className="ml-2 shrink-0">
            {deck.dueCount} due
          </Badge>
        )}
      </div>

      {deck.descriptionMd && (
        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
          {deck.descriptionMd}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" />
          {deck.flashcardCount ?? 0} cards
        </span>
        {deck.newCount != null && deck.newCount > 0 && (
          <Badge variant="blue" className="text-[10px] px-1.5 py-0">
            {deck.newCount} new
          </Badge>
        )}
      </div>

      {deck.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {deck.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Badge>
          ))}
          {deck.tags.length > 4 && (
            <Badge variant="secondary" className="text-[10px]">
              +{deck.tags.length - 4}
            </Badge>
          )}
        </div>
      )}

      <div className="mt-auto pt-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {new Date(deck.updatedAt).toLocaleDateString()}
        </span>
        {hasDue && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onReview(deck.id)
            }}
          >
            <Play className="mr-1 h-3.5 w-3.5" />
            Review
          </Button>
        )}
      </div>
    </div>
  )
}
