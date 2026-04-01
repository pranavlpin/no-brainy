/**
 * Full-text search helpers for PostgreSQL tsvector queries.
 * These are used by the search API to build full-text search queries
 * since Prisma doesn't natively support tsvector expressions.
 */
import { Prisma } from '@prisma/client'

/**
 * Converts a user search query into a PostgreSQL tsquery string.
 * Splits on spaces, joins with & (AND), and appends :* for prefix matching.
 * Example: "hello world" → "hello:* & world:*"
 */
export function toTsQuery(query: string): string {
  return query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(term => `${term}:*`)
    .join(' & ')
}

/**
 * Builds a raw SQL WHERE clause for full-text search on notes.
 */
export function noteSearchCondition(query: string): Prisma.Sql {
  const tsQuery = toTsQuery(query)
  return Prisma.sql`to_tsvector('english', coalesce(title, '') || ' ' || coalesce("contentMd", '')) @@ to_tsquery('english', ${tsQuery})`
}

/**
 * Builds a raw SQL WHERE clause for full-text search on tasks.
 */
export function taskSearchCondition(query: string): Prisma.Sql {
  const tsQuery = toTsQuery(query)
  return Prisma.sql`to_tsvector('english', coalesce(title, '') || ' ' || coalesce("descriptionMd", '')) @@ to_tsquery('english', ${tsQuery})`
}

/**
 * Builds a raw SQL WHERE clause for full-text search on books.
 */
export function bookSearchCondition(query: string): Prisma.Sql {
  const tsQuery = toTsQuery(query)
  return Prisma.sql`to_tsvector('english', coalesce(title, '') || ' ' || coalesce(author, '') || ' ' || coalesce("summaryMd", '')) @@ to_tsquery('english', ${tsQuery})`
}

/**
 * Builds a raw SQL WHERE clause for full-text search on flashcards.
 */
export function flashcardSearchCondition(query: string): Prisma.Sql {
  const tsQuery = toTsQuery(query)
  return Prisma.sql`to_tsvector('english', coalesce("frontMd", '') || ' ' || coalesce("backMd", '')) @@ to_tsquery('english', ${tsQuery})`
}
