'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Play,
  Trash2,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog } from '@/components/ui/dialog'
import { FlashcardForm } from '@/components/flashcards/flashcard-form'
import {
  useDeck,
  useDeckCards,
  useUpdateDeck,
  useDeleteDeck,
  useCreateCard,
  useDeleteCard,
} from '@/hooks/use-flashcards'
import type { FlashcardState, CreateFlashcardRequest } from '@/lib/types/flashcards'

const STATE_BADGE: Record<FlashcardState, { variant: 'blue' | 'yellow' | 'default' | 'green' | 'orange'; label: string }> = {
  new: { variant: 'blue', label: 'New' },
  learning: { variant: 'yellow', label: 'Learning' },
  review: { variant: 'default', label: 'Review' },
  relearning: { variant: 'orange', label: 'Relearning' },
  mastered: { variant: 'green', label: 'Mastered' },
}

export default function DeckDetailPage() {
  const params = useParams()
  const router = useRouter()
  const deckId = params.id as string

  const { data: deck, isLoading: deckLoading } = useDeck(deckId)
  const { data: cardsData, isLoading: cardsLoading } = useDeckCards(deckId)
  const updateDeck = useUpdateDeck()
  const deleteDeck = useDeleteDeck()
  const createCard = useCreateCard()
  const deleteCard = useDeleteCard()

  const [activeTab, setActiveTab] = useState<'cards' | 'add'>('cards')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [descInput, setDescInput] = useState('')
  const [editingDesc, setEditingDesc] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [cardToDelete, setCardToDelete] = useState<string | null>(null)

  const cards = cardsData ?? []
  const dueCount = deck?.dueCount ?? 0
  const newCount = deck?.newCount ?? 0
  const masteredCount = cards.filter((c) => c.state === 'mastered').length
  const totalCards = deck?.flashcardCount ?? cards.length

  if (deckLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!deck) {
    return (
      <div className="flex flex-col items-center py-16">
        <h2 className="text-lg font-medium">Deck not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/flashcards')}>
          Back to Decks
        </Button>
      </div>
    )
  }

  const startEditName = () => {
    setNameInput(deck.name)
    setEditingName(true)
  }
  const saveName = async () => {
    if (nameInput.trim() && nameInput.trim() !== deck.name) {
      await updateDeck.mutateAsync({ id: deckId, name: nameInput.trim() })
    }
    setEditingName(false)
  }
  const startEditDesc = () => {
    setDescInput(deck.descriptionMd)
    setEditingDesc(true)
  }
  const saveDesc = async () => {
    if (descInput !== deck.descriptionMd) {
      await updateDeck.mutateAsync({ id: deckId, descriptionMd: descInput })
    }
    setEditingDesc(false)
  }

  const handleDeleteDeck = async () => {
    await deleteDeck.mutateAsync(deckId)
    router.push('/flashcards')
  }

  const handleCreateCard = async (data: Omit<CreateFlashcardRequest, 'deckId'>) => {
    await createCard.mutateAsync({ ...data, deckId })
    setActiveTab('cards')
  }

  const handleDeleteCard = async () => {
    if (!cardToDelete) return
    await deleteCard.mutateAsync({ id: cardToDelete, deckId })
    setCardToDelete(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/flashcards')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                autoFocus
                className="text-xl font-bold h-auto py-1"
              />
              <Button size="icon" variant="ghost" onClick={saveName}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setEditingName(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <h1
              className="text-2xl font-bold cursor-pointer hover:text-primary/80 group inline-flex items-center gap-2"
              onClick={startEditName}
            >
              {deck.name}
              <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-50" />
            </h1>
          )}

          {editingDesc ? (
            <div className="mt-1 flex items-center gap-2">
              <Input
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveDesc()}
                autoFocus
                placeholder="Add a description..."
                className="text-sm"
              />
              <Button size="icon" variant="ghost" onClick={saveDesc}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setEditingDesc(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p
              className="mt-1 text-sm text-muted-foreground cursor-pointer hover:text-foreground/70"
              onClick={startEditDesc}
            >
              {deck.descriptionMd || 'Add a description...'}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-2xl font-bold">{totalCards}</p>
          <p className="text-xs text-muted-foreground">Total Cards</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-2xl font-bold text-orange-500">{dueCount}</p>
          <p className="text-xs text-muted-foreground">Due Today</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-2xl font-bold text-blue-500">{newCount}</p>
          <p className="text-xs text-muted-foreground">New</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-2xl font-bold text-green-500">{masteredCount}</p>
          <p className="text-xs text-muted-foreground">Mastered</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {dueCount > 0 && (
          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => router.push(`/flashcards/${deckId}/review`)}
          >
            <Play className="mr-2 h-5 w-5" />
            Start Review ({dueCount} cards due)
          </Button>
        )}
        {totalCards > 0 && (
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => router.push(`/flashcards/${deckId}/quiz`)}
          >
            Quiz
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-4">
          <button
            className={`pb-2 text-sm font-medium transition-colors ${
              activeTab === 'cards'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('cards')}
          >
            Cards
          </button>
          <button
            className={`pb-2 text-sm font-medium transition-colors ${
              activeTab === 'add'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('add')}
          >
            Add Card
          </button>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'cards' && (
        <div>
          {cardsLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          )}
          {!cardsLoading && cards.length === 0 && (
            <div className="rounded-lg border border-dashed border-border py-12 text-center">
              <p className="text-muted-foreground">No cards yet.</p>
              <Button variant="outline" className="mt-3" onClick={() => setActiveTab('add')}>
                Add your first card
              </Button>
            </div>
          )}
          {!cardsLoading && cards.length > 0 && (
            <div className="space-y-2">
              {cards.map((card) => {
                const sb = STATE_BADGE[card.state]
                return (
                  <div
                    key={card.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{card.frontMd}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {card.cardType === 'basic' ? 'Q&A' : card.cardType === 'cloze' ? 'Cloze' : 'Reverse'}
                    </Badge>
                    <Badge variant={sb.variant} className="shrink-0 text-[10px]">
                      {sb.label}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:inline">
                      {new Date(card.nextReviewAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setCardToDelete(card.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'add' && (
        <FlashcardForm
          deckId={deckId}
          onSubmit={handleCreateCard}
          onCancel={() => setActiveTab('cards')}
          isSubmitting={createCard.isPending}
        />
      )}

      {/* Delete deck button */}
      <div className="border-t border-border pt-6">
        <Button
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Deck
        </Button>
      </div>

      {/* Delete deck dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete Deck"
        description="This will permanently delete this deck and all its cards. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteDeck}
      />

      {/* Delete card dialog */}
      <Dialog
        open={!!cardToDelete}
        onClose={() => setCardToDelete(null)}
        title="Delete Card"
        description="Are you sure you want to delete this card?"
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteCard}
      />
    </div>
  )
}
