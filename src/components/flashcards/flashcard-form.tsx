'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TagInput } from '@/components/notes/tag-input'
import { MarkdownEditor } from '@/components/editor/markdown-editor'
import type { CardType, CreateFlashcardRequest, FlashcardResponse } from '@/lib/types/flashcards'

const CARD_TYPES: { value: CardType; label: string }[] = [
  { value: 'basic', label: 'Q&A' },
  { value: 'cloze', label: 'Cloze' },
  { value: 'reverse', label: 'Reverse' },
]

interface FlashcardFormProps {
  deckId: string
  card?: FlashcardResponse
  onSubmit: (data: Omit<CreateFlashcardRequest, 'deckId'>) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function FlashcardForm({
  card,
  onSubmit,
  onCancel,
  isSubmitting,
}: FlashcardFormProps) {
  const [cardType, setCardType] = useState<CardType>(card?.cardType ?? 'basic')
  const [frontMd, setFrontMd] = useState(card?.frontMd ?? '')
  const [backMd, setBackMd] = useState(card?.backMd ?? '')
  const [tags, setTags] = useState<string[]>(card?.tags ?? [])
  const [sourceType, setSourceType] = useState(card?.sourceType ?? '')
  const [sourceId, setSourceId] = useState(card?.sourceId ?? '')
  const [sourceExcerpt, setSourceExcerpt] = useState(card?.sourceExcerpt ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!frontMd.trim() || !backMd.trim()) return
    onSubmit({
      cardType,
      frontMd,
      backMd,
      tags: tags.length > 0 ? tags : undefined,
      sourceType: sourceType || undefined,
      sourceId: sourceId || undefined,
      sourceExcerpt: sourceExcerpt || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label className="mb-2 block">Card Type</Label>
        <div className="flex gap-2">
          {CARD_TYPES.map((ct) => (
            <button
              key={ct.value}
              type="button"
              onClick={() => setCardType(ct.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                cardType === ct.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Front (Question / Prompt)</Label>
        <MarkdownEditor
          value={frontMd}
          onChange={setFrontMd}
          placeholder="Enter the question or prompt..."
          minHeight="150px"
        />
      </div>

      <div>
        <Label className="mb-2 block">Back (Answer)</Label>
        <MarkdownEditor
          value={backMd}
          onChange={setBackMd}
          placeholder="Enter the answer..."
          minHeight="150px"
        />
      </div>

      <div>
        <Label className="mb-2 block">Tags</Label>
        <TagInput tags={tags} onChange={setTags} placeholder="Add tags..." />
      </div>

      <details className="group">
        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          Source info (optional)
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <Label className="mb-1 block text-xs">Source Type</Label>
            <Input
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              placeholder="e.g., book, article, note"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Source ID</Label>
            <Input
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              placeholder="Reference ID"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Source Excerpt</Label>
            <Input
              value={sourceExcerpt}
              onChange={(e) => setSourceExcerpt(e.target.value)}
              placeholder="Relevant excerpt"
            />
          </div>
        </div>
      </details>

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !frontMd.trim() || !backMd.trim()}>
          {card ? 'Update Card' : 'Add Card'}
        </Button>
      </div>
    </form>
  )
}
