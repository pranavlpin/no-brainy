import { z } from 'zod'

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  type: z.enum(['all', 'note', 'task', 'book', 'flashcard', 'deck']).default('all'),
  tags: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['relevance', 'date', 'title']).default('relevance'),
})

export type SearchQueryInput = z.infer<typeof searchQuerySchema>
