import { z } from 'zod'
import { isValidDateKey } from '@/lib/dates'

/** Local wall-clock label, 24-hour. */
export const timeLabelSchema = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Use a 24-hour time like 09:30')

const timeBlockSchema = z
  .object({
    id: z.string().min(1),
    startTime: timeLabelSchema,
    endTime: timeLabelSchema,
    title: z.string().trim().min(1, 'Give the block a title').max(300),
    taskId: z.string().optional(),
    color: z.string().optional(),
    isCompleted: z.boolean().default(false),
  })
  .refine((block) => block.startTime < block.endTime, {
    message: 'End time must be later than start time',
    path: ['endTime'],
  })

export const dateParamSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(isValidDateKey, 'Date must be a real calendar day')

export const updateDayPlanSchema = z
  .object({
    focusTaskIds: z.array(z.string()).max(3, 'Maximum 3 focus tasks').optional(),
    timeBlocks: z
      .array(timeBlockSchema)
      .max(100)
      .refine(
        (blocks) => new Set(blocks.map((block) => block.id)).size === blocks.length,
        'Time blocks need unique ids'
      )
      .optional(),
    aiBriefMd: z.string().nullable().optional(),
    intentMd: z.string().max(500, 'Keep the intent under 500 characters').nullable().optional(),
    availableMinutes: z.number().int().min(0).max(1440).optional(),
    bufferMinutes: z.number().int().min(0).max(1440).optional(),
    workStart: timeLabelSchema.nullable().optional(),
    workEnd: timeLabelSchema.nullable().optional(),
  })
  .refine(
    (plan) => !plan.focusTaskIds || new Set(plan.focusTaskIds).size === plan.focusTaskIds.length,
    { message: 'Choose each focus task only once', path: ['focusTaskIds'] }
  )

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
