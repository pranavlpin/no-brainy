import { prisma } from '@/lib/prisma'
import {
  dateFromKey,
  dayBoundsUtc,
  localDayBounds,
  localHour,
  todayKey,
  userTimezone,
} from '@/lib/dates'
import { resolveNotificationPreferences } from './preferences'

export const REVIEW_REMINDER_HOUR = 20
export const MORNING_BRIEF_UNTIL_HOUR = 10

interface GenerateUser {
  id: string
  timezone?: string | null
  preferences?: Record<string, unknown> | null
}

export interface GenerateResult {
  created: string[]
}

/**
 * Create today's nudges for one user: due and overdue tasks, cards due,
 * a morning brief while the plan is empty, and an evening review reminder.
 * Idempotent per local day.
 */
export async function generateForUser(
  user: GenerateUser,
  now: Date = new Date()
): Promise<GenerateResult> {
  const tz = userTimezone(user)
  const key = todayKey(tz, now)
  const hour = localHour(tz, now)
  const { start: todayStart, end: todayEnd } = dayBoundsUtc(key)
  const { start: localStart, end: localEnd } = localDayBounds(key, tz)
  const prefs = resolveNotificationPreferences(
    ((user.preferences ?? {}) as Record<string, unknown>).notificationPreferences as
      Record<string, unknown> | undefined
  )
  const created: string[] = []

  const existsToday = async (type: string, relatedId?: string | null) =>
    prisma.notification.findFirst({
      where: {
        userId: user.id,
        type,
        ...(relatedId !== undefined ? { relatedId } : {}),
        createdAt: { gte: localStart, lt: localEnd },
      },
      select: { id: true },
    })

  const create = async (data: {
    type: string
    title: string
    body: string
    relatedEntity?: string | null
    relatedId?: string | null
  }) => {
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: data.type,
        title: data.title,
        body: data.body,
        relatedEntity: data.relatedEntity ?? null,
        relatedId: data.relatedId ?? null,
      },
    })
    created.push(data.relatedId ? `${data.type}:${data.relatedId}` : data.type)
  }

  if (prefs.dueTasks) {
    const due = await prisma.task.findMany({
      where: {
        userId: user.id,
        dueDate: { gte: todayStart, lt: todayEnd },
        status: { notIn: ['completed', 'cancelled'] },
      },
      select: { id: true, title: true },
    })
    for (const t of due) {
      if (!(await existsToday('due_today', t.id))) {
        await create({
          type: 'due_today',
          title: 'Due today',
          body: t.title,
          relatedEntity: 'task',
          relatedId: t.id,
        })
      }
    }
  }

  if (prefs.overdueTasks) {
    const overdue = await prisma.task.findMany({
      where: {
        userId: user.id,
        dueDate: { lt: todayStart },
        status: { notIn: ['completed', 'cancelled'] },
      },
      select: { id: true, title: true, dueDate: true },
    })
    for (const t of overdue) {
      if (!(await existsToday('overdue', t.id))) {
        const days = t.dueDate
          ? Math.floor((todayStart.getTime() - t.dueDate.getTime()) / 86_400_000)
          : 0
        await create({
          type: 'overdue',
          title: 'Overdue',
          body: `${t.title} · ${days} day${days === 1 ? '' : 's'} past due`,
          relatedEntity: 'task',
          relatedId: t.id,
        })
      }
    }
  }

  if (prefs.flashcardReminders) {
    const dueCards = await prisma.flashcard.findMany({
      where: { userId: user.id, nextReviewAt: { lte: todayStart } },
      select: { deckId: true, deck: { select: { name: true } } },
    })
    const byDeck = new Map<string, { name: string; count: number }>()
    for (const c of dueCards) {
      const entry = byDeck.get(c.deckId)
      if (entry) entry.count++
      else byDeck.set(c.deckId, { name: c.deck.name, count: 1 })
    }
    for (const [deckId, info] of Array.from(byDeck)) {
      if (!(await existsToday('flashcard_review', deckId))) {
        await create({
          type: 'flashcard_review',
          title: 'Cards due',
          body: `${info.count} card${info.count === 1 ? '' : 's'} waiting in "${info.name}"`,
          relatedEntity: 'deck',
          relatedId: deckId,
        })
      }
    }
  }

  if (prefs.morningBrief && hour < MORNING_BRIEF_UNTIL_HOUR) {
    const plan = await prisma.dayPlan.findUnique({
      where: { userId_planDate: { userId: user.id, planDate: dateFromKey(key) } },
      select: { focusTaskIds: true },
    })
    if (!plan || plan.focusTaskIds.length === 0) {
      if (!(await existsToday('morning_brief'))) {
        await create({
          type: 'morning_brief',
          title: 'Plan the day',
          body: 'Pick your three focus tasks and triage yesterday’s leftovers.',
          relatedEntity: 'planner',
        })
      }
    }
  }

  if (prefs.dailyReviewReminders && hour >= REVIEW_REMINDER_HOUR) {
    const review = await prisma.dailyReview.findFirst({
      where: { userId: user.id, reviewDate: dateFromKey(key) },
      select: { id: true },
    })
    if (!review && !(await existsToday('review_reminder'))) {
      await create({
        type: 'review_reminder',
        title: 'Close the day',
        body: 'Two minutes: how did today go, and what is the one thing for tomorrow?',
        relatedEntity: 'review',
      })
    }
  }

  return { created }
}
