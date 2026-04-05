'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  Trash2,
  X,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog } from '@/components/ui/dialog'
import { StarRating } from '@/components/books/star-rating'
import { ReadingProgress } from '@/components/books/reading-progress'
import { KeyIdeasEditor } from '@/components/books/key-ideas-editor'
import { QuotesEditor, type BookQuote } from '@/components/books/quotes-editor'
import { MarkdownEditor } from '@/components/editor/markdown-editor'
import { useBook, useUpdateBook, useDeleteBook } from '@/hooks/use-books'
import { FlashcardGenerator } from '@/components/ai/flashcard-generator'
import { DistillPreview } from '@/components/ai/distill-preview'
import { ActionItemsPreview } from '@/components/ai/action-items-preview'
import { AIActionButton } from '@/components/ai/ai-action-button'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import type { AIActionResponse } from '@/lib/ai/types'
import type { BookStatus, UpdateBookRequest } from '@/lib/types/books'

const statusOptions: { value: BookStatus; label: string; className: string }[] = [
  { value: 'want_to_read', label: 'Want to Read', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'reading', label: 'Reading', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'completed', label: 'Completed', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
]

const contentTabs = [
  { value: 'summary', label: 'Summary' },
  { value: 'key-ideas', label: 'Key Ideas' },
  { value: 'quotes', label: 'Quotes' },
  { value: 'learnings', label: 'Learnings' },
  { value: 'application', label: "How I'll Apply This" },
] as const

type ContentTab = (typeof contentTabs)[number]['value']

const coverColors = [
  'bg-gradient-to-br from-indigo-500 to-purple-600',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-orange-500 to-red-600',
  'bg-gradient-to-br from-blue-500 to-cyan-600',
  'bg-gradient-to-br from-pink-500 to-rose-600',
]

function getCoverColor(title: string): string {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = (hash + title.charCodeAt(i)) % coverColors.length
  }
  return coverColors[hash]
}

export default function BookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: book, isLoading } = useBook(id)
  const updateBook = useUpdateBook()
  const deleteBook = useDeleteBook()

  const [activeTab, setActiveTab] = useState<ContentTab>('summary')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [genreInput, setGenreInput] = useState('')
  const [isDistilling, setIsDistilling] = useState(false)
  const [distillResult, setDistillResult] = useState<{ title: string; contentMd: string; suggestedTags: string[] } | null>(null)
  const [isExtractingActions, setIsExtractingActions] = useState(false)
  const [extractedActions, setExtractedActions] = useState<Array<{ title: string; priority: 'critical' | 'high' | 'medium' | 'low'; reason: string }> | null>(null)

  const save = useCallback(
    (data: UpdateBookRequest) => {
      updateBook.mutate({ id, data })
    },
    [id, updateBook]
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex flex-col gap-6 md:flex-row">
          <Skeleton className="aspect-[3/4] w-48 rounded-lg" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Book not found.</p>
        <Link href="/books" className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}>
          Back to Books
        </Link>
      </div>
    )
  }

  const keyIdeas = (book.keyIdeas ?? []) as string[]
  const quotes = (book.quotes ?? []) as BookQuote[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/books" className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold">{book.title}</h1>
      </div>

      {/* Top section: cover + metadata */}
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Cover */}
        <div className="shrink-0">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="aspect-[3/4] w-48 rounded-lg object-cover shadow-md"
            />
          ) : (
            <div
              className={cn(
                'flex aspect-[3/4] w-48 items-center justify-center rounded-lg shadow-md',
                getCoverColor(book.title)
              )}
            >
              <BookOpen size={64} className="text-white/70" />
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-1 flex-col gap-4">
          {book.author && (
            <p className="text-lg text-muted-foreground">by {book.author}</p>
          )}

          {/* Rating */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Rating:</span>
            <StarRating
              value={book.rating}
              onChange={(rating) => save({ rating })}
              size={22}
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <div className="flex gap-1.5">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    const update: UpdateBookRequest = { status: opt.value }
                    if (opt.value === 'completed' && !book.completedAt) {
                      update.completedAt = new Date().toISOString()
                    }
                    if (opt.value !== 'completed') {
                      update.completedAt = null
                    }
                    save(update)
                  }}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-all',
                    book.status === opt.value
                      ? opt.className
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Progress:</span>
              <Input
                type="number"
                min={0}
                max={book.pagesTotal ?? undefined}
                value={book.pagesRead}
                onChange={(e) => save({ pagesRead: Number(e.target.value) })}
                className="h-8 w-20"
              />
              <span className="text-sm text-muted-foreground">
                / {book.pagesTotal ?? '?'} pages
              </span>
            </div>
            <ReadingProgress
              pagesRead={book.pagesRead}
              pagesTotal={book.pagesTotal}
              className="max-w-xs"
            />
          </div>

          {/* Genre tags */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Genres:</span>
            <div className="flex flex-wrap gap-1.5">
              {book.genre.map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                >
                  {g}
                  <button
                    type="button"
                    onClick={() =>
                      save({ genre: book.genre.filter((x) => x !== g) })
                    }
                    className="hover:text-destructive"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <div className="flex gap-1">
                <Input
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  placeholder="Add genre..."
                  className="h-7 w-28 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const trimmed = genreInput.trim()
                      if (trimmed && !book.genre.includes(trimmed)) {
                        save({ genre: [...book.genre, trimmed] })
                        setGenreInput('')
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content tabs */}
      <div className="space-y-4">
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/50 p-1">
          {contentTabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={cn(
                'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                activeTab === t.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="min-h-[300px]">
          {activeTab === 'summary' && (
            <MarkdownEditor
              value={book.summaryMd}
              onChange={(summaryMd) => save({ summaryMd })}
              placeholder="Write a summary of the book..."
              minHeight="300px"
            />
          )}

          {activeTab === 'key-ideas' && (
            <KeyIdeasEditor
              ideas={keyIdeas}
              onChange={(keyIdeas) => save({ keyIdeas })}
            />
          )}

          {activeTab === 'quotes' && (
            <QuotesEditor
              quotes={quotes}
              onChange={(quotes) => save({ quotes })}
            />
          )}

          {activeTab === 'learnings' && (
            <MarkdownEditor
              value={book.learningsMd}
              onChange={(learningsMd) => save({ learningsMd })}
              placeholder="What did you learn from this book?"
              minHeight="300px"
            />
          )}

          {activeTab === 'application' && (
            <MarkdownEditor
              value={book.applicationMd}
              onChange={(applicationMd) => save({ applicationMd })}
              placeholder="How will you apply what you learned?"
              minHeight="300px"
            />
          )}
        </div>
      </div>

      {/* AI Knowledge Distillation */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <AIActionButton
            label="Distill to Note"
            onClick={async () => {
              setIsDistilling(true)
              setDistillResult(null)
              try {
                const res = await apiClient<AIActionResponse<{ title: string; contentMd: string; suggestedTags: string[] }>>(`/api/books/${id}/ai/distill`, {
                  method: 'POST',
                })
                setDistillResult(res.data)
              } catch {
                // Error handled by AIActionButton pattern
              } finally {
                setIsDistilling(false)
              }
            }}
            isLoading={isDistilling}
          />
          <AIActionButton
            label="Extract Actions"
            onClick={async () => {
              setIsExtractingActions(true)
              setExtractedActions(null)
              try {
                const res = await apiClient<AIActionResponse<{ tasks: Array<{ title: string; priority: 'critical' | 'high' | 'medium' | 'low'; reason: string }> }>>(`/api/books/${id}/ai/actions`, {
                  method: 'POST',
                })
                setExtractedActions(res.data.tasks)
              } catch {
                // Error handled by AIActionButton pattern
              } finally {
                setIsExtractingActions(false)
              }
            }}
            isLoading={isExtractingActions}
          />
        </div>

        {distillResult && (
          <DistillPreview
            title={distillResult.title}
            contentMd={distillResult.contentMd}
            suggestedTags={distillResult.suggestedTags}
            bookId={id}
            onClose={() => setDistillResult(null)}
          />
        )}

        {extractedActions && (
          <ActionItemsPreview
            tasks={extractedActions}
            sourceType="book"
            sourceId={id}
            onClose={() => setExtractedActions(null)}
          />
        )}
      </div>

      {/* AI Flashcard Generation */}
      <FlashcardGenerator sourceType="book" sourceId={id} />

      {/* Delete */}
      <div className="border-t border-border pt-6">
        <Button
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
          disabled={deleteBook.isPending}
        >
          {deleteBook.isPending ? (
            <Loader2 size={16} className="mr-2 animate-spin" />
          ) : (
            <Trash2 size={16} className="mr-2" />
          )}
          Delete Book
        </Button>
      </div>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Book"
        description={`Are you sure you want to delete "${book.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          await deleteBook.mutateAsync(book.id)
          router.push('/books')
        }}
      />
    </div>
  )
}
