'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { StarRating } from './star-rating'
import type {
  WatchlistItemResponse,
  CreateWatchlistRequest,
  UpdateWatchlistRequest,
  WatchlistType,
  WatchlistStatus,
} from '@/lib/types/watchlist'

interface WatchlistFormProps {
  /** If provided, form is in edit mode */
  item?: WatchlistItemResponse
  onSubmit: (data: CreateWatchlistRequest | UpdateWatchlistRequest) => void
  onCancel: () => void
  isLoading?: boolean
}

export function WatchlistForm({
  item,
  onSubmit,
  onCancel,
  isLoading = false,
}: WatchlistFormProps): JSX.Element {
  const [title, setTitle] = useState(item?.title ?? '')
  const [type, setType] = useState<WatchlistType>(item?.type ?? 'movie')
  const [year, setYear] = useState(item?.year?.toString() ?? '')
  const [platform, setPlatform] = useState(item?.platform ?? '')
  const [genreInput, setGenreInput] = useState(item?.genre.join(', ') ?? '')
  const [tagsInput, setTagsInput] = useState(item?.tags.join(', ') ?? '')
  const [notesMd, setNotesMd] = useState(item?.notesMd ?? '')
  const [rating, setRating] = useState<number | null>(item?.rating ?? null)
  const [status, setStatus] = useState<WatchlistStatus>(item?.status ?? 'want_to_watch')

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault()
    const genre = genreInput
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean)
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const yearNum = year ? parseInt(year, 10) : undefined

    const data: CreateWatchlistRequest | UpdateWatchlistRequest = {
      title,
      type,
      genre,
      tags,
      status,
      rating: rating ?? undefined,
      notesMd,
      coverUrl: undefined,
      year: yearNum,
      platform: platform || undefined,
    }

    onSubmit(data)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border-2 border-retro-dark/20 bg-card p-4"
    >
      <h3 className="font-display text-lg font-bold text-retro-dark">
        {item ? 'Edit Item' : 'Add to Watchlist'}
      </h3>

      {/* Title */}
      <div>
        <label className="mb-1 block font-mono text-xs font-bold uppercase text-retro-dark/60">
          Title *
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Movie or show title"
          required
          className="rounded-none"
        />
      </div>

      {/* Type + Year row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block font-mono text-xs font-bold uppercase text-retro-dark/60">
            Type
          </label>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as WatchlistType)}
          >
            <option value="movie">Movie</option>
            <option value="show">Show</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block font-mono text-xs font-bold uppercase text-retro-dark/60">
            Year
          </label>
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2024"
            min={1888}
            max={2100}
            className="rounded-none"
          />
        </div>
      </div>

      {/* Platform */}
      <div>
        <label className="mb-1 block font-mono text-xs font-bold uppercase text-retro-dark/60">
          Platform
        </label>
        <Input
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          placeholder="Netflix, Prime, Hulu..."
          className="rounded-none"
        />
      </div>

      {/* Genre */}
      <div>
        <label className="mb-1 block font-mono text-xs font-bold uppercase text-retro-dark/60">
          Genre (comma-separated)
        </label>
        <Input
          value={genreInput}
          onChange={(e) => setGenreInput(e.target.value)}
          placeholder="Action, Sci-Fi, Drama"
          className="rounded-none"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1 block font-mono text-xs font-bold uppercase text-retro-dark/60">
          Tags (comma-separated)
        </label>
        <Input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="must-watch, oscar-winner"
          className="rounded-none"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block font-mono text-xs font-bold uppercase text-retro-dark/60">
          Notes
        </label>
        <textarea
          value={notesMd}
          onChange={(e) => setNotesMd(e.target.value)}
          placeholder="Your thoughts..."
          rows={3}
          className="flex w-full border-2 border-retro-dark/20 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-retro-blue focus-visible:ring-offset-2"
        />
      </div>

      {/* Rating */}
      <div>
        <label className="mb-1 block font-mono text-xs font-bold uppercase text-retro-dark/60">
          Rating
        </label>
        <StarRating value={rating} onChange={setRating} size={24} />
      </div>

      {/* Status */}
      <div>
        <label className="mb-1 block font-mono text-xs font-bold uppercase text-retro-dark/60">
          Status
        </label>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as WatchlistStatus)}
        >
          <option value="want_to_watch">Want to Watch</option>
          <option value="watching">Watching</option>
          <option value="completed">Completed</option>
          <option value="dropped">Dropped</option>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isLoading || !title.trim()}
          className="border-2 border-retro-dark bg-retro-blue px-4 py-2 font-mono text-sm font-bold text-white shadow-hard hover-shadow-grow disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : item ? 'Update' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border-2 border-retro-dark/20 bg-background px-4 py-2 font-mono text-sm font-bold text-retro-dark hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
