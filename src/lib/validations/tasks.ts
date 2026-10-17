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

/** Planned days are calendar keys only; they never carry a time. */
export const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine(isValidDateKey, 'Not a real calendar day')

export const effortSchema = z.enum(['light', 'steady', 'deep'])
export const contextSchema = z.enum(['work', 'personal'])

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  descriptionMd: z.string().default(''),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).default('medium'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  tags: z.array(z.string()).default([]),
  dueDate: dueDateSchema.nullable().optional(),
  plannedDate: dateKeySchema.nullable().optional(),
  estimatedMinutes: z.number().int().min(1).max(1440).nullable().optional(),
  effort: effortSchema.nullable().optional(),
  context: contextSchema.nullable().optional(),
  parentTaskId: z.string().optional(),
  goalId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
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

export const updateTaskSchema = createTaskSchema.partial().extend({
  /** When present, the update is rejected with 409 if the stored row changed since. */
  expectedUpdatedAt: z.string().datetime().optional(),
})

export const taskQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  /** `active` means pending or in progress. */
  status: z.enum(['active', 'pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).optional(),
  quadrant: z.string().optional(),
  tags: z.string().optional(),
  search: z.string().optional(),
  dueDate: dateKeySchema.optional(),
  dueDateFrom: dateKeySchema.optional(),
  dueDateTo: dateKeySchema.optional(),
  plannedDate: dateKeySchema.optional(),
  plannedDateFrom: dateKeySchema.optional(),
  plannedDateTo: dateKeySchema.optional(),
  context: contextSchema.optional(),
  parentTaskId: z.string().optional(),
  goalId: z.string().optional(),
  projectId: z.string().optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'dueDate', 'plannedDate', 'priority', 'orderIndex'])
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
