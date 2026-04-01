'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, BookOpen } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { BookCard } from '@/components/books/book-card'
import { useBooks } from '@/hooks/use-books'
import { cn } from '@/lib/utils'
import type { BookStatus } from '@/lib/types/books'

type TabValue = 'all' | BookStatus

const tabs: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'want_to_read', label: 'Want to Read' },
  { value: 'reading', label: 'Reading' },
  { value: 'completed', label: 'Completed' },
]

const emptyMessages: Record<TabValue, string> = {
  all: 'No books yet. Add your first book to get started!',
  want_to_read: 'No books in your reading list. Add one to plan your next read.',
  reading: 'You are not reading any books right now.',
  completed: 'No completed books yet. Keep reading!',
  abandoned: 'No abandoned books.',
}

export default function BooksPage() {
  const [tab, setTab] = useState<TabValue>('all')
  const [search, setSearch] = useState('')

  const filters = {
    ...(tab !== 'all' ? { status: tab as BookStatus } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
  }

  const { data: books, isLoading } = useBooks(
    Object.keys(filters).length > 0 ? filters : undefined
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Books</h1>
        <Link href="/books/new" className={buttonVariants()}>
          <Plus size={16} className="mr-2" />
          Add Book
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === t.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search books..."
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col overflow-hidden rounded-lg border border-border">
              <Skeleton className="aspect-[3/4] w-full rounded-none" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : books && books.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <BookOpen size={48} className="text-muted-foreground/40" />
          <p className="mt-4 text-sm text-muted-foreground">
            {emptyMessages[tab]}
          </p>
          <Link href="/books/new" className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}>
            <Plus size={16} className="mr-2" />
            Add Book
          </Link>
        </div>
      )}
    </div>
  )
}
