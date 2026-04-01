'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, X } from 'lucide-react'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateBook } from '@/hooks/use-books'
import type { BookStatus } from '@/lib/types/books'

const statusOptions: { value: BookStatus; label: string }[] = [
  { value: 'want_to_read', label: 'Want to Read' },
  { value: 'reading', label: 'Reading' },
  { value: 'completed', label: 'Completed' },
]

export default function NewBookPage() {
  const router = useRouter()
  const createBook = useCreateBook()

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [status, setStatus] = useState<BookStatus>('want_to_read')
  const [pagesTotal, setPagesTotal] = useState('')
  const [genreInput, setGenreInput] = useState('')
  const [genres, setGenres] = useState<string[]>([])

  function addGenre() {
    const trimmed = genreInput.trim()
    if (trimmed && !genres.includes(trimmed)) {
      setGenres([...genres, trimmed])
      setGenreInput('')
    }
  }

  function removeGenre(g: string) {
    setGenres(genres.filter((x) => x !== g))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    const book = await createBook.mutateAsync({
      title: title.trim(),
      ...(author.trim() ? { author: author.trim() } : {}),
      ...(coverUrl.trim() ? { coverUrl: coverUrl.trim() } : {}),
      ...(genres.length > 0 ? { genre: genres } : {}),
      status,
      ...(pagesTotal.trim() ? { pagesTotal: Number(pagesTotal) } : {}),
    })

    router.push(`/books/${book.id}`)
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/books" className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold">Add Book</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Book title"
            required
          />
        </div>

        {/* Author */}
        <div className="space-y-2">
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author name"
          />
        </div>

        {/* Cover URL */}
        <div className="space-y-2">
          <Label htmlFor="coverUrl">Cover Image URL</Label>
          <Input
            id="coverUrl"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://..."
            type="url"
          />
        </div>

        {/* Genre Tags */}
        <div className="space-y-2">
          <Label>Genre Tags</Label>
          <div className="flex gap-2">
            <Input
              value={genreInput}
              onChange={(e) => setGenreInput(e.target.value)}
              placeholder="Add genre..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addGenre()
                }
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={addGenre}>
              Add
            </Button>
          </div>
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {genres.map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                >
                  {g}
                  <button
                    type="button"
                    onClick={() => removeGenre(g)}
                    className="ml-0.5 hover:text-destructive"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as BookStatus)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Pages Total */}
        <div className="space-y-2">
          <Label htmlFor="pagesTotal">Total Pages</Label>
          <Input
            id="pagesTotal"
            value={pagesTotal}
            onChange={(e) => setPagesTotal(e.target.value)}
            placeholder="e.g. 320"
            type="number"
            min={1}
          />
        </div>

        {/* Error */}
        {createBook.isError && (
          <p className="text-sm text-destructive">
            Failed to create book. Please try again.
          </p>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Link href="/books" className={buttonVariants({ variant: 'outline' })}>
            Cancel
          </Link>
          <Button type="submit" disabled={!title.trim() || createBook.isPending}>
            {createBook.isPending && (
              <Loader2 size={16} className="mr-2 animate-spin" />
            )}
            Create Book
          </Button>
        </div>
      </form>
    </div>
  )
}
