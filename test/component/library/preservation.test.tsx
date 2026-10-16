import { fireEvent, render, screen } from '@testing-library/react'
import { it, expect, vi } from 'vitest'
import BooksPage from '@/app/(dashboard)/books/page'
import { MarkdownPreview } from '@/components/editor/markdown-preview'
import { BookmarkCard } from '@/components/bookmarks/bookmark-card'
import type { BookmarkResponse } from '@/lib/types/bookmarks'
import { BookCard } from '@/components/books/book-card'
import type { BookResponse } from '@/lib/types/books'
import { WatchlistCard } from '@/components/watchlist/watchlist-card'
import type { WatchlistItemResponse } from '@/lib/types/watchlist'
const retry = vi.hoisted(() => vi.fn())
it('names watchlist edit and delete controls', () => {
  const edit = vi.fn(),
    remove = vi.fn()
  render(
    <WatchlistCard
      item={
        {
          id: 'movie',
          title: 'A film',
          type: 'movie',
          status: 'want_to_watch',
          genre: [],
          rating: null,
        } as unknown as WatchlistItemResponse
      }
      onEdit={edit}
      onDelete={remove}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: 'Edit A film' }))
  fireEvent.click(screen.getByRole('button', { name: 'Delete A film' }))
  expect(edit).toHaveBeenCalledOnce()
  expect(remove).toHaveBeenCalledWith('movie')
})
vi.mock('@/hooks/use-books', () => ({
  useBooks: () => ({ data: undefined, isLoading: false, isError: true, refetch: retry }),
}))
vi.mock('@/components/editor/wiki-link', () => ({
  WikiLink: ({ title }: { title: string }) => <a href="/notes/resolved-note">{title}</a>,
}))
vi.mock('@/components/editor/mermaid-diagram', () => ({
  MermaidDiagram: ({ chart }: { chart: string }) => (
    <div role="img" aria-label="Mermaid diagram">
      {chart}
    </div>
  ),
}))
it('shows an actionable books read error instead of an empty library', () => {
  render(<BooksPage />)
  expect(screen.getByRole('alert')).toHaveTextContent('Could not load')
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(retry).toHaveBeenCalled()
})
it('preserves Markdown, code, wiki-link boundaries and diagrams', () => {
  render(
    <MarkdownPreview
      content={
        '# A useful idea\n\n**Keep this** and [[Linked idea]].\n\n```ts\nconst answer = 42\n```\n\n```mermaid\ngraph TD; A-->B\n```'
      }
    />
  )
  expect(screen.getByRole('heading', { name: 'A useful idea' })).toBeInTheDocument()
  expect(screen.getByText('Keep this').tagName).toBe('STRONG')
  expect(screen.getByRole('link', { name: 'Linked idea' })).toHaveAttribute(
    'href',
    '/notes/resolved-note'
  )
  expect(screen.getByRole('img', { name: 'Mermaid diagram' })).toHaveTextContent('A-->B')
  expect(screen.getByText('42')).toBeInTheDocument()
})
it('keeps a book usable when its external cover fails', () => {
  render(
    <BookCard
      book={
        {
          id: 'book',
          title: 'A useful book',
          coverUrl: 'https://example.test/cover.jpg',
          status: 'reading',
          genre: [],
          pagesRead: 2,
          pagesTotal: 10,
          rating: null,
        } as unknown as BookResponse
      }
    />
  )
  fireEvent.error(screen.getByRole('img', { name: 'A useful book' }))
  expect(screen.queryByRole('img', { name: 'A useful book' })).toBeNull()
  expect(screen.getByRole('link')).toHaveAttribute('href', '/books/book')
})

it('opens a saved reference from a keyboard-reachable named control', () => {
  const open = vi.fn()
  render(
    <BookmarkCard
      bookmark={
        {
          id: 'reference',
          title: 'A useful reference',
          url: 'https://example.test',
          tags: [],
          favicon: null,
          isPinned: false,
        } as unknown as BookmarkResponse
      }
      onClick={open}
      onEdit={() => {}}
      onDelete={() => {}}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: 'Open A useful reference' }))
  expect(open).toHaveBeenCalledTimes(1)
})
