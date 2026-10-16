import { z } from 'zod'
import { calendarDate } from '@/lib/dates/calendar'

const deadline = z
  .string()
  .refine((value) => calendarDate(value) !== null, 'Use a valid calendar date')
  .transform((value) => calendarDate(value)!)
const statuses = z.enum(['pending', 'in_progress', 'completed', 'cancelled'])
const priorities = z.enum(['urgent', 'high', 'medium', 'low'])

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(500),
  descriptionMd: z.string().default(''),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).default('medium'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  tags: z.array(z.string()).default([]),
  dueDate: deadline.nullable().optional(),
  parentTaskId: z.string().nullable().optional(),
  goalId: z.string().nullable().optional(),
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

export const updateTaskSchema = createTaskSchema
  .partial()
  .extend({ expectedUpdatedAt: z.string().datetime().optional() })

export const taskQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    status: z
      .string()
      .transform((value) => (value === 'active' ? ['pending', 'in_progress'] : value.split(',')))
      .pipe(z.array(statuses).min(1))
      .optional(),
    priority: z
      .string()
      .transform((value) => value.split(','))
      .pipe(z.array(priorities).min(1))
      .optional(),
    quadrant: z.string().optional(),
    tags: z.string().optional(),
    search: z.string().optional(),
    dueDate: deadline.optional(),
    dueDateFrom: deadline.optional(),
    dueDateTo: deadline.optional(),
    parentTaskId: z.string().optional(),
    goalId: z.string().optional(),
    sortBy: z
      .enum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'orderIndex', 'title'])
      .default('orderIndex'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  })
  .refine((data) => !data.dueDateFrom || !data.dueDateTo || data.dueDateFrom <= data.dueDateTo, {
    message: 'Start date must precede end date',
    path: ['dueDateTo'],
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
