import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { todayInTimezone } from '@/lib/dates/calendar'
import { reminderPreferences, reminderClock, isQuiet } from '@/lib/reviews/reminders'
export const POST = withAuth(async (_req, user) => {
  try {
    const today = todayInTimezone(user.timezone),
      clock = reminderClock(user.timezone)
    const generated = await prisma.$transaction(async (db) => {
      const current = await db.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      })
      const prefs = reminderPreferences(
        (current.preferences as Record<string, unknown> | null)?.notificationPreferences
      )
      if (!prefs.enabled || isQuiet(prefs, clock)) return []
      const created: string[] = []
      const add = async (
        type: string,
        title: string,
        body: string,
        relatedEntity: string,
        relatedId: string | null
      ) => {
        const id =
          'nr' +
          createHash('sha256')
            .update([user.id, today, type, relatedId].join(':'))
            .digest('hex')
            .slice(0, 30)
        if (await db.notification.findUnique({ where: { id } })) return
        await db.notification.create({
          data: { id, userId: user.id, type, title, body, relatedEntity, relatedId },
        })
        created.push(id)
      }
      const tasks = await db.task.findMany({
        where: {
          userId: user.id,
          status: { in: ['pending', 'in_progress'] },
          routinePaused: false,
          OR: [{ goalId: null }, { goal: { status: 'active' } }],
        },
      })
      for (const task of tasks) {
        const due = task.dueDate?.toISOString().slice(0, 10),
          planned = task.plannedDate?.toISOString().slice(0, 10)
        if (prefs.dueTasks && due === today)
          await add('due_today', 'Task due today', task.title, 'task', task.id)
        else if (prefs.overdueTasks && due && due < today)
          await add('overdue', 'A deadline to revisit', task.title, 'task', task.id)
        else if (prefs.habitReminders && task.isRecurring && planned && planned <= today)
          await add('routine', 'A practice you planned', task.title, 'task', task.id)
      }
      if (prefs.flashcardReminders) {
        const cards = await db.flashcard.findMany({
          where: { userId: user.id, nextReviewAt: { lte: new Date(today) } },
          include: { deck: { select: { name: true } } },
        })
        const decks = new Map<string, { name: string; count: number }>()
        for (const card of cards) {
          const deck = decks.get(card.deckId)
          if (deck) deck.count++
          else decks.set(card.deckId, { name: card.deck.name, count: 1 })
        }
        for (const [id, deck] of decks)
          await add(
            'flashcard_review',
            'A little learning, when you’re ready',
            `${deck.count} cards in ${deck.name}`,
            'deck',
            id
          )
      }
      if (prefs.dailyReviewReminders && clock >= prefs.reviewTime) {
        const review = await db.dailyReview.findUnique({
          where: { userId_reviewDate: { userId: user.id, reviewDate: new Date(today) } },
        })
        if (!review?.closedAt && !review?.reflectionMd)
          await add(
            'daily_review',
            'A moment to close the day',
            'Notice what moved forward and choose a gentle next step.',
            'review',
            null
          )
      }
      return created
    })
    return NextResponse.json({
      success: true,
      data: { generated: generated.length, notifications: generated },
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'REMINDER_ERROR', message: 'Could not check reminders. Try again later.' },
      },
      { status: 500 }
    )
  }
})
