import { z } from 'zod'

const timeBlockSchema = z.object({
  id: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  title: z.string(),
  taskId: z.string().optional(),
  color: z.string().optional(),
  isCompleted: z.boolean().default(false),
})

export const updateDayPlanSchema = z.object({
  focusTaskIds: z.array(z.string()).max(3, 'Maximum 3 focus tasks').optional(),
  timeBlocks: z.array(timeBlockSchema).optional(),
  aiBriefMd: z.string().nullable().optional(),
})

export const dateParamSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Date must be in YYYY-MM-DD format'
)
