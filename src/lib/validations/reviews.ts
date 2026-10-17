import { z } from 'zod'
import { isMonday } from '@/lib/reviews/weeks'
import { dateKeySchema } from '@/lib/validations/tasks'

const tomorrowIntentSchema = z.string().max(280, "Keep tomorrow's intent under 280 characters")

export const createReviewSchema = z.object({
  reviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  reflectionMd: z.string().default(''),
  mood: z.enum(['great', 'good', 'okay', 'bad']).optional(),
  tomorrowIntent: tomorrowIntentSchema.optional(),
})

export const updateReviewSchema = z.object({
  reflectionMd: z.string().optional(),
  aiSummaryMd: z.string().nullable().optional(),
  mood: z.enum(['great', 'good', 'okay', 'bad']).nullable().optional(),
  tomorrowIntent: tomorrowIntentSchema.nullable().optional(),
})

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const weeklyQuerySchema = z.object({
  week: z
    .string()
    .regex(/^\d{4}-W\d{2}$/, 'Must be ISO week format YYYY-Www')
    .optional(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>
export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>
export type WeeklyQueryInput = z.infer<typeof weeklyQuerySchema>

/** Weeks are keyed by their Monday. */
export const weekStartParamSchema = dateKeySchema.refine(isMonday, 'Weeks start on Monday')

const outcomeSchema = z.object({
  id: z.string().min(1).max(40),
  text: z.string().trim().min(1).max(500),
})

export const weeklyReviewSchema = z.object({
  stopDoing: z.string().max(5000).optional(),
  keepDoing: z.string().max(5000).optional(),
  startTrying: z.string().max(5000).optional(),
  reflectionMd: z.string().max(20000).optional(),
  outcomes: z.array(outcomeSchema).max(3, 'Three outcomes is enough for one week').optional(),
  /** An open task to plan onto next Monday. */
  nextTaskId: z.string().nullable().optional(),
  closeReview: z.boolean().optional(),
  expectedUpdatedAt: z.string().datetime().optional(),
})

export type WeeklyReviewInput = z.infer<typeof weeklyReviewSchema>
