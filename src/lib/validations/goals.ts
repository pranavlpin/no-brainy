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

export const createHabitSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  goalId: z.string().nullable().optional(),
})

export const updateHabitSchema = createHabitSchema.partial()

export const habitQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  goalId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const createHabitLogSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  completed: z.boolean(),
})

export const habitLogQuerySchema = z.object({
  from: z.string().min(1, 'From date is required'),
  to: z.string().min(1, 'To date is required'),
})
