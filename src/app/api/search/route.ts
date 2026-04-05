import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { searchQuerySchema } from '@/lib/validations/search'
import { ZodError } from 'zod'
import type { SearchResult, SearchResponse, SearchEntityType } from '@/lib/types/search'
import type { ApiResponse } from '@/lib/types/api'

function stripMarkdown(text: string): string {
  return text
    .replace(/[#*_~`>\[\]()!]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}

function makePreview(text: string, maxLen = 150): string {
  const stripped = stripMarkdown(text)
  if (stripped.length <= maxLen) return stripped
  return stripped.slice(0, maxLen) + '...'
}

/**
 * Multi-term enhanced scoring.
 * Title exact match (10x) > title word boundary (5x) > title contains (3x) > tags match (2x) > content match (1x)
 */
function scoreResult(
  title: string,
  content: string,
  query: string,
  tags: string[] = []
): number {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0)
  if (terms.length === 0) return 0

  const t = title.toLowerCase()
  const c = content.toLowerCase()
  const tagStr = tags.join(' ').toLowerCase()

  let totalScore = 0

  for (const term of terms) {
    let termScore = 0

    // Title exact match (10x)
    if (t === term) {
      termScore += 100
    }
    // Title word boundary match (5x)
    else if (new RegExp(`\\b${escapeRegex(term)}\\b`, 'i').test(t)) {
      termScore += 50
    }
    // Title contains (3x)
    else if (t.includes(term)) {
      termScore += 30
    }

    // Tags match (2x)
    if (tagStr.includes(term)) {
      termScore += 20
    }

    // Content match (1x)
    if (c.includes(term)) {
      termScore += 10
    }

    totalScore += termScore
  }

  return totalScore
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Extract highlight snippets from content where search terms appear.
 */
function extractHighlights(
  content: string,
  query: string,
  maxSnippets = 3,
  snippetLen = 100
): string[] {
  const stripped = stripMarkdown(content)
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0)
  if (terms.length === 0) return []

  const highlights: string[] = []
  const lower = stripped.toLowerCase()

  for (const term of terms) {
    const idx = lower.indexOf(term)
    if (idx === -1) continue

    const start = Math.max(0, idx - Math.floor(snippetLen / 2))
    const end = Math.min(stripped.length, idx + term.length + Math.floor(snippetLen / 2))
    let snippet = stripped.slice(start, end)

    if (start > 0) snippet = '...' + snippet
    if (end < stripped.length) snippet = snippet + '...'

    // Bold the matched term in the snippet
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi')
    snippet = snippet.replace(regex, '**$1**')

    highlights.push(snippet)

    if (highlights.length >= maxSnippets) break
  }

  return highlights
}

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const queryObj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryObj[key] = value
    })

    const params = searchQuerySchema.parse(queryObj)
    const { q, type, tags, limit, dateFrom, dateTo, sortBy } = params

    const searchTitleOnly = q.length < 3
    const tagList = tags
      ? tags.split(',').map(t => t.trim()).filter(Boolean)
      : undefined

    // Build date filter
    const dateFilter: { updatedAt?: { gte?: Date; lte?: Date } } = {}
    if (dateFrom || dateTo) {
      dateFilter.updatedAt = {}
      if (dateFrom) dateFilter.updatedAt.gte = new Date(dateFrom)
      if (dateTo) {
        // Include the entire end date
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        dateFilter.updatedAt.lte = endDate
      }
    }

    const results: SearchResult[] = []

    const shouldSearch = (entityType: string) =>
      type === 'all' || type === entityType

    // --- Notes ---
    const notesPromise = shouldSearch('note')
      ? prisma.note.findMany({
          where: {
            userId: user.id,
            isDeleted: false,
            ...dateFilter,
            ...(tagList && tagList.length > 0
              ? { tags: { hasSome: tagList } }
              : {}),
            ...(searchTitleOnly
              ? { title: { contains: q, mode: 'insensitive' as const } }
              : {
                  OR: [
                    { title: { contains: q, mode: 'insensitive' as const } },
                    { contentMd: { contains: q, mode: 'insensitive' as const } },
                  ],
                }),
          },
          select: {
            id: true,
            title: true,
            contentMd: true,
            tags: true,
            updatedAt: true,
          },
          take: limit,
          orderBy: { updatedAt: 'desc' },
        })
      : Promise.resolve([])

    // --- Tasks ---
    const tasksPromise = shouldSearch('task')
      ? prisma.task.findMany({
          where: {
            userId: user.id,
            ...dateFilter,
            ...(tagList && tagList.length > 0
              ? { tags: { hasSome: tagList } }
              : {}),
            ...(searchTitleOnly
              ? { title: { contains: q, mode: 'insensitive' as const } }
              : {
                  OR: [
                    { title: { contains: q, mode: 'insensitive' as const } },
                    {
                      descriptionMd: {
                        contains: q,
                        mode: 'insensitive' as const,
                      },
                    },
                  ],
                }),
          },
          select: {
            id: true,
            title: true,
            descriptionMd: true,
            tags: true,
            updatedAt: true,
          },
          take: limit,
          orderBy: { updatedAt: 'desc' },
        })
      : Promise.resolve([])

    // --- Books ---
    const booksPromise = shouldSearch('book')
      ? prisma.book.findMany({
          where: {
            userId: user.id,
            ...dateFilter,
            ...(searchTitleOnly
              ? { title: { contains: q, mode: 'insensitive' as const } }
              : {
                  OR: [
                    { title: { contains: q, mode: 'insensitive' as const } },
                    { author: { contains: q, mode: 'insensitive' as const } },
                    {
                      summaryMd: {
                        contains: q,
                        mode: 'insensitive' as const,
                      },
                    },
                  ],
                }),
          },
          select: {
            id: true,
            title: true,
            author: true,
            summaryMd: true,
            genre: true,
            updatedAt: true,
          },
          take: limit,
          orderBy: { updatedAt: 'desc' },
        })
      : Promise.resolve([])

    // --- Flashcards ---
    const flashcardsPromise = shouldSearch('flashcard')
      ? prisma.flashcard.findMany({
          where: {
            userId: user.id,
            ...dateFilter,
            ...(tagList && tagList.length > 0
              ? { tags: { hasSome: tagList } }
              : {}),
            ...(searchTitleOnly
              ? { frontMd: { contains: q, mode: 'insensitive' as const } }
              : {
                  OR: [
                    { frontMd: { contains: q, mode: 'insensitive' as const } },
                    { backMd: { contains: q, mode: 'insensitive' as const } },
                  ],
                }),
          },
          select: {
            id: true,
            frontMd: true,
            backMd: true,
            tags: true,
            updatedAt: true,
          },
          take: limit,
          orderBy: { updatedAt: 'desc' },
        })
      : Promise.resolve([])

    // --- Decks ---
    const decksPromise = shouldSearch('deck')
      ? prisma.deck.findMany({
          where: {
            userId: user.id,
            ...dateFilter,
            ...(tagList && tagList.length > 0
              ? { tags: { hasSome: tagList } }
              : {}),
            ...(searchTitleOnly
              ? { name: { contains: q, mode: 'insensitive' as const } }
              : {
                  OR: [
                    { name: { contains: q, mode: 'insensitive' as const } },
                    { descriptionMd: { contains: q, mode: 'insensitive' as const } },
                  ],
                }),
          },
          select: {
            id: true,
            name: true,
            descriptionMd: true,
            tags: true,
            updatedAt: true,
          },
          take: limit,
          orderBy: { updatedAt: 'desc' },
        })
      : Promise.resolve([])

    const [notes, tasks, books, flashcards, decks] = await Promise.all([
      notesPromise,
      tasksPromise,
      booksPromise,
      flashcardsPromise,
      decksPromise,
    ])

    for (const note of notes) {
      results.push({
        id: note.id,
        entityType: 'note',
        title: note.title || 'Untitled Note',
        excerpt: makePreview(note.contentMd),
        tags: note.tags,
        score: scoreResult(note.title, note.contentMd, q, note.tags),
        highlights: extractHighlights(note.contentMd, q),
        createdAt: note.updatedAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      })
    }

    for (const task of tasks) {
      results.push({
        id: task.id,
        entityType: 'task',
        title: task.title,
        excerpt: makePreview(task.descriptionMd),
        tags: task.tags,
        score: scoreResult(task.title, task.descriptionMd, q, task.tags),
        highlights: extractHighlights(task.descriptionMd, q),
        createdAt: task.updatedAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      })
    }

    for (const book of books) {
      const content = [book.author || '', book.summaryMd].join(' ')
      results.push({
        id: book.id,
        entityType: 'book',
        title: book.title,
        excerpt: makePreview(content),
        tags: book.genre,
        score: scoreResult(book.title, content, q, book.genre),
        highlights: extractHighlights(content, q),
        createdAt: book.updatedAt.toISOString(),
        updatedAt: book.updatedAt.toISOString(),
      })
    }

    for (const card of flashcards) {
      results.push({
        id: card.id,
        entityType: 'flashcard',
        title: stripMarkdown(card.frontMd).slice(0, 80) || 'Flashcard',
        excerpt: makePreview(card.backMd),
        tags: card.tags,
        score: scoreResult(card.frontMd, card.backMd, q, card.tags),
        highlights: extractHighlights(card.backMd, q),
        createdAt: card.updatedAt.toISOString(),
        updatedAt: card.updatedAt.toISOString(),
      })
    }

    for (const deck of decks) {
      results.push({
        id: deck.id,
        entityType: 'deck',
        title: deck.name,
        excerpt: makePreview(deck.descriptionMd),
        tags: deck.tags,
        score: scoreResult(deck.name, deck.descriptionMd, q, deck.tags),
        highlights: extractHighlights(deck.descriptionMd, q),
        createdAt: deck.updatedAt.toISOString(),
        updatedAt: deck.updatedAt.toISOString(),
      })
    }

    // Sort based on sortBy parameter
    if (sortBy === 'date') {
      results.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    } else if (sortBy === 'title') {
      results.sort((a, b) => a.title.localeCompare(b.title))
    } else {
      // relevance: score descending, then by updatedAt descending
      results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
    }

    // Limit total results
    const limited = results.slice(0, limit)

    const entityTypes: SearchEntityType[] =
      type === 'all'
        ? ['note', 'task', 'book', 'flashcard', 'deck']
        : [type as SearchEntityType]

    const response: ApiResponse<SearchResponse> = {
      success: true,
      data: {
        results: limited,
        total: limited.length,
        query: q,
        entityTypes: [...entityTypes],
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ZodError) {
      const details: Record<string, string[]> = {}
      for (const issue of error.issues) {
        const field = issue.path.join('.')
        if (!details[field]) details[field] = []
        details[field].push(issue.message)
      }
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid search parameters',
            details,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
})
