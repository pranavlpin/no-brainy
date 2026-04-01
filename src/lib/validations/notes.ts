import { z } from 'zod'

export const createNoteSchema = z.object({
  title: z.string().max(500).default(''),
  contentMd: z.string().default(''),
  tags: z.array(z.string()).default([]),
  isPinned: z.boolean().default(false),
})

export const updateNoteSchema = z.object({
  title: z.string().max(500).optional(),
  contentMd: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
})

export const noteQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  isPinned: z.coerce.boolean().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
export type NoteQueryInput = z.infer<typeof noteQuerySchema>
