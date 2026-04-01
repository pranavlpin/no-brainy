import { z } from 'zod'

export const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  author: z.string().optional(),
  coverUrl: z.string().url().optional().or(z.literal('')),
  genre: z.array(z.string()).default([]),
  status: z.enum(['want_to_read', 'reading', 'completed']).default('want_to_read'),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  summaryMd: z.string().default(''),
  keyIdeas: z.array(z.object({ text: z.string(), order: z.number() })).default([]),
  quotes: z.array(z.object({ text: z.string(), page: z.number().optional() })).default([]),
  learningsMd: z.string().default(''),
  applicationMd: z.string().default(''),
  pagesTotal: z.number().int().positive().nullable().optional(),
  pagesRead: z.number().int().min(0).default(0),
})

export const updateBookSchema = createBookSchema.partial()

export const bookQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['want_to_read', 'reading', 'completed']).optional(),
  search: z.string().optional(),
  genre: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'rating']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type CreateBookInput = z.infer<typeof createBookSchema>
export type UpdateBookInput = z.infer<typeof updateBookSchema>
export type BookQueryInput = z.infer<typeof bookQuerySchema>
