'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Check, X, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { AIActionButton } from '@/components/ai/ai-action-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { apiClient } from '@/lib/api-client'
import { useDecks, useCreateDeck } from '@/hooks/use-flashcards'
import type { GeneratedFlashcard, FlashcardGenerationResult } from '@/lib/ai/types'
import type { CardType, CreateFlashcardRequest, DeckResponse } from '@/lib/types/flashcards'
import type { ApiResponse } from '@/lib/types/api'
import type { AIActionResponse } from '@/lib/ai/types'

interface FlashcardGeneratorProps {
  sourceType: 'note' | 'book'
  sourceId: string
}

/** Map AI-generated cardType to the DB cardType */
function mapCardType(aiType: GeneratedFlashcard['cardType']): CardType {
  switch (aiType) {
    case 'qa':
      return 'basic'
    case 'cloze':
      return 'cloze'
    case 'definition':
      return 'basic'
    default:
      return 'basic'
  }
}

interface SelectableCard extends GeneratedFlashcard {
  selected: boolean
}

export function FlashcardGenerator({ sourceType, sourceId }: FlashcardGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [cards, setCards] = useState<SelectableCard[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedDeckId, setSelectedDeckId] = useState<string>('')
  const [newDeckName, setNewDeckName] = useState('')
  const [isCreatingDeck, setIsCreatingDeck] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<string | null>(null)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const queryClient = useQueryClient()
  const { data: decks } = useDecks()
  const createDeck = useCreateDeck()

  const selectedCount = cards.filter((c) => c.selected).length
  const totalCount = cards.length

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    setCards([])
    setSaveResult(null)

    try {
      const endpoint =
        sourceType === 'note'
          ? `/api/notes/${sourceId}/ai/flashcards`
          : `/api/books/${sourceId}/ai/flashcards`

      const res = await apiClient<AIActionResponse<FlashcardGenerationResult>>(endpoint, {
        method: 'POST',
      })

      setCards(
        res.data.cards.map((card) => ({
          ...card,
          selected: true,
        }))
      )
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } }
      setError(apiErr?.error?.message ?? 'Failed to generate flashcards. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleCard = (index: number) => {
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c))
    )
  }

  const selectAll = () => {
    setCards((prev) => prev.map((c) => ({ ...c, selected: true })))
  }

  const deselectAll = () => {
    setCards((prev) => prev.map((c) => ({ ...c, selected: false })))
  }

  const removeCard = (index: number) => {
    setCards((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreateDeck = async () => {
    const name = newDeckName.trim()
    if (!name) return

    setIsCreatingDeck(true)
    try {
      const deck = await createDeck.mutateAsync({ name })
      setSelectedDeckId(deck.id)
      setNewDeckName('')
    } finally {
      setIsCreatingDeck(false)
    }
  }

  const handleSave = async () => {
    if (!selectedDeckId || selectedCount === 0) return

    setIsSaving(true)
    setSaveResult(null)

    try {
      const selected = cards.filter((c) => c.selected)
      const promises = selected.map((card) => {
        const data: CreateFlashcardRequest = {
          deckId: selectedDeckId,
          cardType: mapCardType(card.cardType),
          frontMd: card.frontMd,
          backMd: card.backMd,
          sourceType,
          sourceId,
          sourceExcerpt: card.sourceExcerpt,
        }
        return apiClient<ApiResponse<unknown>>(`/api/decks/${selectedDeckId}/cards`, {
          method: 'POST',
          body: JSON.stringify(data),
        })
      })

      await Promise.all(promises)
      // Invalidate deck and card queries so counts update
      queryClient.invalidateQueries({ queryKey: ['decks'] })
      queryClient.invalidateQueries({ queryKey: ['flashcards'] })
      setSaveResult(`${selected.length} card${selected.length === 1 ? '' : 's'} saved successfully!`)
      setCards([])
    } catch {
      setSaveResult('Failed to save some cards. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const cardTypeLabel = (type: GeneratedFlashcard['cardType']) => {
    switch (type) {
      case 'qa':
        return 'Q&A'
      case 'cloze':
        return 'Cloze'
      case 'definition':
        return 'Definition'
      default:
        return type
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <AIActionButton
          label="Generate Flashcards"
          onClick={handleGenerate}
          isLoading={isGenerating}
        />
        {saveResult && (
          <span className="text-sm text-muted-foreground">{saveResult}</span>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {cards.length > 0 && (
        <div className="space-y-3 rounded-lg border border-border p-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {totalCount} card{totalCount !== 1 ? 's' : ''} generated, {selectedCount} selected
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
            </div>
          </div>

          {/* Card list */}
          <div className="space-y-2">
            {cards.map((card, index) => (
              <div
                key={index}
                className="rounded-md border border-border bg-background"
              >
                {/* Card header row */}
                <div className="flex items-center gap-3 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => toggleCard(index)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                      card.selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background'
                    }`}
                  >
                    {card.selected && <Check className="h-3 w-3" />}
                  </button>

                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {cardTypeLabel(card.cardType)}
                  </span>

                  <span className="min-w-0 flex-1 truncate text-sm">
                    {card.frontMd}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedIndex(expandedIndex === index ? null : index)
                    }
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    {expandedIndex === index ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => removeCard(index)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    title="Remove card"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Expanded details */}
                {expandedIndex === index && (
                  <div className="border-t border-border px-3 py-3 text-sm">
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-muted-foreground">Front: </span>
                        <span>{card.frontMd}</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Back: </span>
                        <span>{card.backMd}</span>
                      </div>
                      {card.sourceExcerpt && (
                        <div className="mt-2 rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                          <span className="font-medium">Source: </span>
                          {card.sourceExcerpt}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Deck picker + save */}
          <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium">Save to deck</label>
              <Select
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
                className="h-9"
              >
                <option value="">Select a deck...</option>
                {decks?.map((deck: DeckResponse) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1 sm:flex-initial">
                <Input
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="New deck name..."
                  className="h-9 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCreateDeck()
                    }
                  }}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateDeck}
                disabled={!newDeckName.trim() || isCreatingDeck}
                className="h-9"
              >
                {isCreatingDeck ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>

            <Button
              onClick={handleSave}
              disabled={!selectedDeckId || selectedCount === 0 || isSaving}
              className="h-9"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                `Save ${selectedCount} Card${selectedCount !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
