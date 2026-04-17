import { z } from 'zod'

export const createWatchlistSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  type: z.enum(['movie', 'show']).default('movie'),
  genre: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  status: z.enum(['want_to_watch', 'watching', 'completed', 'dropped']).default('want_to_watch'),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  notesMd: z.string().default(''),
  coverUrl: z.string().url().optional().or(z.literal('')),
  year: z.number().int().min(1888).max(2100).nullable().optional(),
  platform: z.string().max(200).optional(),
})

export const updateWatchlistSchema = createWatchlistSchema.partial()

export const watchlistQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['movie', 'show']).optional(),
  status: z.enum(['want_to_watch', 'watching', 'completed', 'dropped']).optional(),
  search: z.string().optional(),
  genre: z.string().optional(),
  tags: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'rating', 'year']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type CreateWatchlistInput = z.infer<typeof createWatchlistSchema>
export type UpdateWatchlistInput = z.infer<typeof updateWatchlistSchema>
export type WatchlistQueryInput = z.infer<typeof watchlistQuerySchema>
