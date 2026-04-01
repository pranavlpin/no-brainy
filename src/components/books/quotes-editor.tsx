'use client'

import { useState } from 'react'
import { Plus, X, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface BookQuote {
  text: string
  page?: number | null
}

interface QuotesEditorProps {
  quotes: BookQuote[]
  onChange: (quotes: BookQuote[]) => void
  readOnly?: boolean
}

export function QuotesEditor({
  quotes,
  onChange,
  readOnly = false,
}: QuotesEditorProps) {
  const [newText, setNewText] = useState('')
  const [newPage, setNewPage] = useState('')

  function addQuote() {
    const trimmed = newText.trim()
    if (!trimmed) return
    const page = newPage.trim() ? Number(newPage.trim()) : null
    onChange([...quotes, { text: trimmed, page }])
    setNewText('')
    setNewPage('')
  }

  function removeQuote(index: number) {
    onChange(quotes.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {quotes.length === 0 && readOnly && (
        <p className="text-sm text-muted-foreground">No quotes yet.</p>
      )}

      <div className="space-y-3">
        {quotes.map((q, i) => (
          <div
            key={i}
            className="relative rounded-md border-l-4 border-primary/30 bg-muted/50 p-4"
          >
            <Quote
              size={16}
              className="absolute right-3 top-3 text-muted-foreground/30"
            />
            <p className="pr-6 text-sm italic">&ldquo;{q.text}&rdquo;</p>
            {q.page != null && (
              <p className="mt-1 text-xs text-muted-foreground">
                Page {q.page}
              </p>
            )}
            {!readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-3 bottom-2 h-7 w-7 text-destructive"
                onClick={() => removeQuote(i)}
              >
                <X size={14} />
              </Button>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add a quote..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addQuote()
              }
            }}
          />
          <Input
            value={newPage}
            onChange={(e) => setNewPage(e.target.value)}
            placeholder="Page #"
            className="w-24"
            type="number"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addQuote()
              }
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={addQuote}>
            <Plus size={16} className="mr-1" />
            Add
          </Button>
        </div>
      )}
    </div>
  )
}
