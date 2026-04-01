'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog } from '@/components/ui/dialog'
import { TagInput } from '@/components/notes/tag-input'
import { DeckCard } from '@/components/flashcards/deck-card'
import { useDecks, useCreateDeck } from '@/hooks/use-flashcards'

export default function FlashcardsPage() {
  const router = useRouter()
  const { data, isLoading } = useDecks()
  const createDeck = useCreateDeck()

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newTags, setNewTags] = useState<string[]>([])

  const handleCreate = async () => {
    if (!newName.trim()) return
    const deck = await createDeck.mutateAsync({
      name: newName.trim(),
      descriptionMd: newDesc || undefined,
      tags: newTags.length > 0 ? newTags : undefined,
    })
    setShowCreate(false)
    setNewName('')
    setNewDesc('')
    setNewTags([])
    router.push(`/flashcards/${deck.id}`)
  }

  const decks = data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Flashcards</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Deck
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && decks.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Layers className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No decks yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first flashcard deck to start studying.
          </p>
          <Button className="mt-4" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Deck
          </Button>
        </div>
      )}

      {!isLoading && decks.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onOpen={(id) => router.push(`/flashcards/${id}`)}
              onReview={(id) => router.push(`/flashcards/${id}/review`)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Deck"
        confirmLabel="Create"
        onConfirm={handleCreate}
      >
        <div className="space-y-4">
          <div>
            <Label className="mb-1 block">Name</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Deck name"
              autoFocus
            />
          </div>
          <div>
            <Label className="mb-1 block">Description</Label>
            <Input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div>
            <Label className="mb-1 block">Tags</Label>
            <TagInput tags={newTags} onChange={setNewTags} />
          </div>
        </div>
      </Dialog>
    </div>
  )
}
