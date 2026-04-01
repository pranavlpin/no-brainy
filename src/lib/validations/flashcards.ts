import { z } from 'zod'

export const createDeckSchema = z.object({
  name: z.string().min(1).max(200),
  descriptionMd: z.string().default(''),
  tags: z.array(z.string()).default([]),
})

export const updateDeckSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  descriptionMd: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const deckQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  tags: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const createFlashcardSchema = z.object({
  cardType: z.enum(['basic', 'cloze', 'reverse']),
  frontMd: z.string().min(1),
  backMd: z.string().min(1),
  tags: z.array(z.string()).default([]),
  sourceType: z.string().optional(),
  sourceId: z.string().optional(),
  sourceExcerpt: z.string().optional(),
})

export const updateFlashcardSchema = z.object({
  cardType: z.enum(['basic', 'cloze', 'reverse']).optional(),
  frontMd: z.string().min(1).optional(),
  backMd: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  deckId: z.string().optional(),
})

export const cardQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  state: z.enum(['new', 'learning', 'review', 'relearning', 'mastered']).optional(),
  tags: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'nextReviewAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const rateCardSchema = z.object({
  rating: z.enum(['forgot', 'hard', 'medium', 'easy']),
  sessionId: z.string(),
})

export type CreateDeckInput = z.infer<typeof createDeckSchema>
export type UpdateDeckInput = z.infer<typeof updateDeckSchema>
export type DeckQueryInput = z.infer<typeof deckQuerySchema>
export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>
export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>
export type CardQueryInput = z.infer<typeof cardQuerySchema>
export type RateCardInput = z.infer<typeof rateCardSchema>
