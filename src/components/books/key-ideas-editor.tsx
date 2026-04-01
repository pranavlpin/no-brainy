'use client'

import { useState } from 'react'
import { Plus, X, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface KeyIdeasEditorProps {
  ideas: string[]
  onChange: (ideas: string[]) => void
  readOnly?: boolean
}

export function KeyIdeasEditor({
  ideas,
  onChange,
  readOnly = false,
}: KeyIdeasEditorProps) {
  const [newIdea, setNewIdea] = useState('')

  function addIdea() {
    const trimmed = newIdea.trim()
    if (!trimmed) return
    onChange([...ideas, trimmed])
    setNewIdea('')
  }

  function removeIdea(index: number) {
    onChange(ideas.filter((_, i) => i !== index))
  }

  function moveIdea(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= ideas.length) return
    const next = [...ideas]
    const tmp = next[index]
    next[index] = next[target]
    next[target] = tmp
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {ideas.length === 0 && readOnly && (
        <p className="text-sm text-muted-foreground">No key ideas yet.</p>
      )}

      <ol className="space-y-2">
        {ideas.map((idea, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-2.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {i + 1}
            </span>
            <p className="mt-2 flex-1 text-sm">{idea}</p>
            {!readOnly && (
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={i === 0}
                  onClick={() => moveIdea(i, -1)}
                >
                  <ChevronUp size={14} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={i === ideas.length - 1}
                  onClick={() => moveIdea(i, 1)}
                >
                  <ChevronDown size={14} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeIdea(i)}
                >
                  <X size={14} />
                </Button>
              </div>
            )}
          </li>
        ))}
      </ol>

      {!readOnly && (
        <div className="flex gap-2">
          <Input
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            placeholder="Add a key idea..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addIdea()
              }
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={addIdea}>
            <Plus size={16} className="mr-1" />
            Add
          </Button>
        </div>
      )}
    </div>
  )
}
