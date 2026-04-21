import { z } from 'zod'

export const createBookmarkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  url: z.string().url('Must be a valid URL'),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  favicon: z.string().url().optional().or(z.literal('')),
})

export const updateBookmarkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500).optional(),
  url: z.string().url('Must be a valid URL').optional(),
  description: z.string().max(2000).nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  favicon: z.string().url().nullable().optional().or(z.literal('')),
  isPinned: z.boolean().optional(),
})

export const bookmarkQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  tags: z.string().optional(),
  isPinned: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>
export type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>
export type BookmarkQueryInput = z.infer<typeof bookmarkQuerySchema>
