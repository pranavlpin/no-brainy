import { z } from 'zod'
import { calendarDate } from '@/lib/dates/calendar'

const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Use a valid time')

const timeBlockSchema = z
  .object({
    id: z.string().min(1),
    startTime: time,
    endTime: time,
    title: z.string().trim().min(1).max(300),
    taskId: z.string().optional(),
    color: z.string().optional(),
    isCompleted: z.boolean().default(false),
  })
  .refine((block) => block.startTime < block.endTime, 'End time must follow start time')

export const updateDayPlanSchema = z
  .object({
    mainOutcome: z.string().max(1000).optional(),
    availableMinutes: z.number().int().min(0).max(1440).optional(),
    bufferMinutes: z.number().int().min(0).max(1440).optional(),
    workStart: time.nullable().optional(),
    workEnd: time.nullable().optional(),
    growthTaskId: z.string().nullable().optional(),
    expectedUpdatedAt: z.string().datetime().optional(),
    focusTaskIds: z.array(z.string()).max(3, 'Maximum 3 focus tasks').optional(),
    timeBlocks: z
      .array(timeBlockSchema)
      .max(100)
      .refine(
        (blocks) => new Set(blocks.map((block) => block.id)).size === blocks.length,
        'Time blocks need unique identities'
      )
      .optional(),
    aiBriefMd: z.string().nullable().optional(),
  })
  .refine(
    (plan) => !plan.focusTaskIds || new Set(plan.focusTaskIds).size === plan.focusTaskIds.length,
    'Choose each priority only once'
  )

export const dateParamSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((value) => calendarDate(value) === value, 'Choose a real calendar day')
