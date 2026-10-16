import { z } from 'zod'
import { isValidDateKey } from '@/lib/dates'

const timeBlockSchema = z.object({
  id: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  title: z.string(),
  taskId: z.string().optional(),
  color: z.string().optional(),
  isCompleted: z.boolean().default(false),
})

export const dateParamSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(isValidDateKey, 'Date must be a real calendar day')

export const updateDayPlanSchema = z.object({
  focusTaskIds: z.array(z.string()).max(3, 'Maximum 3 focus tasks').optional(),
  timeBlocks: z.array(timeBlockSchema).optional(),
  aiBriefMd: z.string().nullable().optional(),
  intentMd: z.string().max(500, 'Keep the intent under 500 characters').nullable().optional(),
})

/** Morning triage decision for a leftover task. */
export const triageSchema = z
  .object({
    taskId: z.string().min(1),
    action: z.enum(['keep', 'move', 'drop']),
    date: dateParamSchema.optional(),
  })
  .refine((v) => v.action !== 'move' || !!v.date, {
    message: 'A date is required to move a task',
    path: ['date'],
  })

export type TriageInput = z.infer<typeof triageSchema>
