import { z } from 'zod'
import { isValidDateKey } from '@/lib/dates'

/**
 * Due dates arrive either as a date key (`YYYY-MM-DD`, from date inputs and
 * triage) or as an ISO datetime. Both normalize to an ISO string so the
 * database receives UTC midnight for date keys.
 */
export const dueDateSchema = z
  .string()
  .refine(
    (v) => isValidDateKey(v) || (!Number.isNaN(Date.parse(v)) && /\d{4}-\d{2}-\d{2}T/.test(v)),
    'Invalid date'
  )
  .transform((v) => (isValidDateKey(v) ? `${v}T00:00:00.000Z` : new Date(v).toISOString()))

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  descriptionMd: z.string().default(''),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).default('medium'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  tags: z.array(z.string()).default([]),
  dueDate: dueDateSchema.nullable().optional(),
  parentTaskId: z.string().optional(),
  goalId: z.string().optional(),
  quadrant: z
    .enum([
      'urgent_important',
      'not_urgent_important',
      'urgent_not_important',
      'not_urgent_not_important',
    ])
    .nullable()
    .optional(),
  isRecurring: z.boolean().default(false),
  rrule: z.string().nullable().optional(),
})

export const updateTaskSchema = createTaskSchema.partial()

export const taskQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).optional(),
  quadrant: z.string().optional(),
  tags: z.string().optional(),
  search: z.string().optional(),
  dueDate: z.string().optional(),
  parentTaskId: z.string().optional(),
  goalId: z.string().optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'orderIndex'])
    .default('orderIndex'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const reorderSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string(),
      orderIndex: z.number(),
    })
  ),
})

export const bulkActionSchema = z.object({
  taskIds: z.array(z.string()).min(1),
  action: z.enum(['complete', 'delete', 'setPriority']),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).optional(),
})
