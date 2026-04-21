import { z } from 'zod'

export const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().default(''),
  category: z.string().nullable().optional(),
  targetDate: z.string().nullable().optional(),
  status: z.enum(['active', 'completed', 'paused', 'abandoned']).default('active'),
})

export const updateGoalSchema = createGoalSchema.partial()

export const goalQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['active', 'completed', 'paused', 'abandoned']).optional(),
  category: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'targetDate', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})
