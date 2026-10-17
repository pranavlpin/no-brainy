import { prisma } from '@/lib/prisma'
import { addDays, dateFromKey } from '@/lib/dates'

/**
 * Carry tonight's "one thing for tomorrow" into tomorrow's plan as its
 * intent. Only fills an empty intent, or replaces the one a previous
 * handoff wrote, so text the user typed into the plan directly is kept.
 */
export async function handoffIntentToNextDay(params: {
  userId: string
  reviewDateKey: string
  intent: string
  previousIntent: string | null
}): Promise<boolean> {
  const intent = params.intent.trim()
  if (!intent) return false
  const planDate = dateFromKey(addDays(params.reviewDateKey, 1))

  const existing = await prisma.dayPlan.findUnique({
    where: { userId_planDate: { userId: params.userId, planDate } },
    select: { id: true, intentMd: true },
  })
  const current = existing?.intentMd?.trim() ?? ''
  const previous = params.previousIntent?.trim() ?? ''
  const canWrite = !existing || !current || current === previous || current === intent
  if (!canWrite) return false

  await prisma.dayPlan.upsert({
    where: { userId_planDate: { userId: params.userId, planDate } },
    update: { intentMd: intent },
    create: { userId: params.userId, planDate, focusTaskIds: [], timeBlocks: [], intentMd: intent },
  })
  return true
}
