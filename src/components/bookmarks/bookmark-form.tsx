'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import type {
  BookmarkResponse,
  CreateBookmarkRequest,
  UpdateBookmarkRequest,
} from '@/lib/types/bookmarks'

interface BookmarkFormProps {
  bookmark?: BookmarkResponse
  onSubmit: (data: CreateBookmarkRequest | UpdateBookmarkRequest) => void
  onCancel: () => void
  isLoading?: boolean
}

export function BookmarkForm({ bookmark, onSubmit, onCancel, isLoading }: BookmarkFormProps) {
  const [title, setTitle] = useState(bookmark?.title ?? '')
  const [url, setUrl] = useState(bookmark?.url ?? '')
  const [description, setDescription] = useState(bookmark?.description ?? '')
  const [tagsInput, setTagsInput] = useState(bookmark?.tags?.join(', ') ?? '')

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault()
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    onSubmit({
      title,
      url,
      description: description || undefined,
      tags: tags.length > 0 ? tags : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wider text-retro-dark/70">
          Title
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bookmark title"
          required
          className="rounded-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wider text-retro-dark/70">
          URL
        </label>
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          required
          className="rounded-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wider text-retro-dark/70">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={2}
          className="w-full rounded-none rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-retro-blue"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wider text-retro-dark/70">
          Tags (comma-separated)
        </label>
        <Input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="design, tools, reference"
          className="rounded-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : bookmark ? 'Update Bookmark' : 'Save Bookmark'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold text-retro-dark hover:bg-retro-dark/5"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
