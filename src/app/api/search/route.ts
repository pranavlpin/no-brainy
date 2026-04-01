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

function scoreResult(
  title: string,
  content: string,
  query: string
): number {
  const q = query.toLowerCase()
  const t = title.toLowerCase()
  if (t === q) return 100
  if (t.startsWith(q)) return 90
  if (t.includes(q)) return 80
  if (content.toLowerCase().includes(q)) return 50
  return 10
}

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const queryObj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryObj[key] = value
    })

    const params = searchQuerySchema.parse(queryObj)
    const { q, type, tags, limit } = params

    const searchTitleOnly = q.length < 3
    const tagList = tags
      ? tags.split(',').map(t => t.trim()).filter(Boolean)
      : undefined

    const results: SearchResult[] = []

    const shouldSearch = (entityType: string) =>
      type === 'all' || type === entityType

    // --- Notes ---
    const notesPromise = shouldSearch('note')
      ? prisma.note.findMany({
          where: {
            userId: user.id,
            isDeleted: false,
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
        score: scoreResult(note.title, note.contentMd, q),
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
        score: scoreResult(task.title, task.descriptionMd, q),
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
        score: scoreResult(book.title, content, q),
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
        score: scoreResult(card.frontMd, card.backMd, q),
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
        score: scoreResult(deck.name, deck.descriptionMd, q),
        createdAt: deck.updatedAt.toISOString(),
        updatedAt: deck.updatedAt.toISOString(),
      })
    }

    // Sort by relevance score descending, then by updatedAt descending
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

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
