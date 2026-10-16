import { z } from 'zod'
import { calendarDate } from '@/lib/dates/calendar'
const date = z
  .string()
  .refine((value) => !!calendarDate(value), 'Choose a valid calendar date')
  .transform((value) => calendarDate(value)!)
export const createGoalSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(500),
  description: z.string().max(10000).default(''),
  successCriteria: z.string().trim().max(5000).default(''),
  baseline: z.number().finite().nullable().optional(),
  target: z.number().finite().nullable().optional(),
  unit: z.string().trim().max(80).nullable().optional(),
  weeklyPracticeTarget: z.number().int().min(1).max(21).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  targetDate: date.nullable().optional(),
  startDate: date.nullable().optional(),
  expenseCategoryId: z.string().nullable().optional(),
  expenseTag: z.string().max(100).nullable().optional(),
  targetAmount: z.number().positive().nullable().optional(),
  status: z.enum(['active', 'completed', 'paused', 'abandoned']).default('active'),
})
export const updateGoalSchema = createGoalSchema
  .partial()
  .extend({ expectedUpdatedAt: z.string().datetime().optional() })
export const goalQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['active', 'completed', 'paused', 'abandoned']).optional(),
  category: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'targetDate', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})
