'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'

interface DistillPreviewProps {
  title: string
  contentMd: string
  suggestedTags: string[]
  bookId: string
  onClose: () => void
}

interface NoteCreated {
  id: string
  title: string
}

export function DistillPreview({
  title: initialTitle,
  contentMd: initialContent,
  suggestedTags: initialTags,
  bookId,
  onClose,
}: DistillPreviewProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [tags, setTags] = useState(initialTags)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      // Create the note
      const noteRes = await apiClient<ApiResponse<NoteCreated>>('/api/notes', {
        method: 'POST',
        body: JSON.stringify({
          title,
          contentMd: content,
          tags,
        }),
      })

      // Link the note to the book
      try {
        await apiClient(`/api/notes/${noteRes.data.id}/links`, {
          method: 'POST',
          body: JSON.stringify({
            targetType: 'book',
            targetId: bookId,
          }),
        })
      } catch {
        // Link creation is best-effort
      }

      router.push(`/notes/${noteRes.data.id}`)
    } catch {
      setError('Failed to save note. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Distilled Note Preview</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-sm"
        />
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Tags</label>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
            >
              {tag}
              <button
                type="button"
                onClick={() => setTags(tags.filter((t) => t !== tag))}
                className="hover:text-destructive"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Content Preview */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="w-full rounded-md border border-border bg-background p-3 text-sm font-mono"
        />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving || !title.trim()}>
          {isSaving ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save as Note'
          )}
        </Button>
      </div>
    </div>
  )
}
