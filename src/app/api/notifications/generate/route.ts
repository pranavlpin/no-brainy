import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'

export const POST = withAuth(async (_req: NextRequest, user) => {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    // Load user preferences to check which notification types are enabled
    const prefs = (user.preferences ?? {}) as Record<string, unknown>
    const notifPrefs = (prefs.notificationPreferences ?? {}) as Record<string, boolean>
    const isEnabled = (type: string) => notifPrefs[type] !== false // default enabled

    const created: string[] = []

    // 1. Due today tasks
    if (isEnabled('dueTasks')) {
      const dueTodayTasks = await prisma.task.findMany({
        where: {
          userId: user.id,
          dueDate: { gte: todayStart, lt: todayEnd },
          status: { not: 'completed' },
        },
      })

      for (const task of dueTodayTasks) {
        const exists = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: 'due_today',
            relatedId: task.id,
            createdAt: { gte: todayStart, lt: todayEnd },
          },
        })
        if (!exists) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: 'due_today',
              title: 'Task due today',
              body: task.title,
              relatedEntity: 'task',
              relatedId: task.id,
            },
          })
          created.push(`due_today:${task.id}`)
        }
      }
    }

    // 2. Overdue tasks
    if (isEnabled('overdueTasks')) {
      const overdueTasks = await prisma.task.findMany({
        where: {
          userId: user.id,
          dueDate: { lt: todayStart },
          status: { not: 'completed' },
        },
      })

      for (const task of overdueTasks) {
        const exists = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: 'overdue',
            relatedId: task.id,
            createdAt: { gte: todayStart, lt: todayEnd },
          },
        })
        if (!exists) {
          const daysOverdue = Math.floor(
            (todayStart.getTime() - new Date(task.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
          )
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: 'overdue',
              title: 'Overdue task',
              body: `${task.title} - This task has been pending ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}`,
              relatedEntity: 'task',
              relatedId: task.id,
            },
          })
          created.push(`overdue:${task.id}`)
        }
      }
    }


    // 4. Flashcard review reminders - cards due for review
    if (isEnabled('flashcardReminders')) {
      const dueCards = await prisma.flashcard.findMany({
        where: {
          userId: user.id,
          nextReviewAt: { lte: todayEnd },
        },
        include: { deck: { select: { id: true, name: true } } },
      })

      // Group by deck
      const deckMap = new Map<string, { name: string; count: number }>()
      for (const card of dueCards) {
        const existing = deckMap.get(card.deckId)
        if (existing) {
          existing.count++
        } else {
          deckMap.set(card.deckId, { name: card.deck.name, count: 1 })
        }
      }

      for (const [deckId, info] of Array.from(deckMap)) {
        const exists = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: 'flashcard_review',
            relatedId: deckId,
            createdAt: { gte: todayStart, lt: todayEnd },
          },
        })
        if (!exists) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: 'flashcard_review',
              title: 'Cards due for review',
              body: `${info.count} card${info.count !== 1 ? 's' : ''} due in "${info.name}"`,
              relatedEntity: 'deck',
              relatedId: deckId,
            },
          })
          created.push(`flashcard_review:${deckId}`)
        }
      }
    }

    // 5. Daily review reminder - no review created today
    if (isEnabled('dailyReviewReminders')) {
      const todayReview = await prisma.dailyReview.findFirst({
        where: {
          userId: user.id,
          reviewDate: { gte: todayStart, lt: todayEnd },
        },
      })

      if (!todayReview) {
        const exists = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: 'daily_review',
            createdAt: { gte: todayStart, lt: todayEnd },
          },
        })
        if (!exists) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: 'daily_review',
              title: 'Daily review',
              body: "You haven't completed your daily review yet",
              relatedEntity: 'review',
              relatedId: null,
            },
          })
          created.push('daily_review')
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { generated: created.length, notifications: created },
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})
