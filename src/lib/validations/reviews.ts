import { z } from 'zod'
import { calendarDate } from '@/lib/dates/calendar'
import { weekStartFor } from '@/lib/growth/progress'
export const reviewDateSchema = z
  .string()
  .refine((value) => calendarDate(value) === value, 'Choose a valid calendar date')
const text = z.string().max(30000)
export const updateReviewSchema = z.object({
  expectedUpdatedAt: z.string().datetime().optional(),
  whatMoved: text.optional(),
  blockers: text.optional(),
  tomorrowTaskId: z.string().min(1).nullable().optional(),
  reflectionMd: text.optional(),
  aiSummaryMd: text.nullable().optional(),
  mood: z.enum(['great', 'good', 'okay', 'bad']).nullable().optional(),
  closeReview: z.boolean().optional(),
})
export const createReviewSchema = updateReviewSchema.extend({ reviewDate: reviewDateSchema })
export const weeklyReviewSchema = z.object({
  expectedUpdatedAt: z.string().datetime().optional(),
  stopDoing: text.optional(),
  keepDoing: text.optional(),
  startTrying: text.optional(),
  reflectionMd: text.optional(),
  outcomes: z
    .array(
      z.object({
        id: z.enum(['first', 'second', 'third']),
        text: z.string().trim().min(1).max(500),
      })
    )
    .max(3)
    .refine(
      (items) => new Set(items.map((item) => item.id)).size === items.length,
      'Use each outcome slot once'
    )
    .optional(),
  nextTaskId: z.string().min(1).nullable().optional(),
  closeReview: z.boolean().optional(),
})
export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export const weeklyQuerySchema = z.object({
  week: z
    .string()
    .regex(/^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/, 'Use an ISO week')
    .optional(),
})
/** Validate an explicit Monday key for persisted weekly reflections. */
export const weekDateSchema = reviewDateSchema.refine(
  (value) => weekStartFor(value) === value,
  'Choose the Monday of the week'
)
export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>
export type WeeklyReviewInput = z.infer<typeof weeklyReviewSchema>
export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>
export type WeeklyQueryInput = z.infer<typeof weeklyQuerySchema>
