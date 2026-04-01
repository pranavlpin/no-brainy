import { z } from 'zod'

export const createReviewSchema = z.object({
  reviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  reflectionMd: z.string().default(''),
  mood: z.enum(['great', 'good', 'okay', 'bad']).optional(),
})

export const updateReviewSchema = z.object({
  reflectionMd: z.string().optional(),
  mood: z.enum(['great', 'good', 'okay', 'bad']).nullable().optional(),
})

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const weeklyQuerySchema = z.object({
  week: z.string().regex(/^\d{4}-W\d{2}$/, 'Must be ISO week format YYYY-Www').optional(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>
export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>
export type WeeklyQueryInput = z.infer<typeof weeklyQuerySchema>
