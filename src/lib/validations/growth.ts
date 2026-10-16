import { z } from 'zod'
import { calendarDate } from '@/lib/dates/calendar'
const date = z
  .string()
  .refine((value) => calendarDate(value) === value, 'Choose a valid calendar date')
const sourceType = z.enum(['note', 'book', 'project', 'session'])
export const evidenceSchema = z
  .object({
    clientRequestId: z.string().uuid(),
    goalId: z.string().min(1),
    observedAt: date,
    summary: z.string().trim().min(1, 'Add a short observation').max(10000),
    measurement: z.number().finite().nullable().optional(),
    kind: z.enum(['reflection', 'practice', 'rest', 'skip']).default('reflection'),
    sourceType: sourceType.nullable().optional(),
    sourceId: z.string().min(1).nullable().optional(),
  })
  .refine((input) => !!input.sourceType === !!input.sourceId, {
    message: 'Choose a source or leave both source fields empty',
  })
export const evidenceEditSchema = z.object({
  expectedUpdatedAt: z.string().datetime(),
  observedAt: date.optional(),
  summary: z.string().trim().min(1).max(10000).optional(),
  measurement: z.number().finite().nullable().optional(),
  kind: z.enum(['reflection', 'practice', 'rest', 'skip']).optional(),
})
export const growthActionSchema = z
  .object({
    clientRequestId: z.string().uuid(),
    goalId: z.string().min(1).nullable().optional(),
    title: z.string().trim().min(1).max(500),
    priority: z.enum(['urgent', 'high', 'medium', 'low']).optional(),
    description: z.string().max(10000).default(''),
    plannedDate: date.nullable().optional(),
    estimatedMinutes: z.number().int().min(1).max(1440).nullable().optional(),
    rrule: z.enum(['FREQ=DAILY', 'FREQ=WEEKLY', 'FREQ=MONTHLY']).nullable().optional(),
    sourceType: z.enum(['note', 'book']).nullable().optional(),
    sourceId: z.string().min(1).nullable().optional(),
  })
  .refine((input) => !!input.sourceType === !!input.sourceId, {
    message: 'Choose a source or leave both source fields empty',
  })
export const growthQuerySchema = z.object({
  goalId: z.string().optional(),
  week: date.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
})
export const growthSourceQuerySchema = z.object({
  type: sourceType,
  search: z.string().max(200).default(''),
  page: z.coerce.number().int().positive().default(1),
})
