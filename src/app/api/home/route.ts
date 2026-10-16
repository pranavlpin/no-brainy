import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import {
  addDays,
  dateFromKey,
  dayBoundsUtc,
  keyFromDbDate,
  localHour,
  todayKey,
  userTimezone,
} from '@/lib/dates'
import { dayPhase } from '@/lib/home/phase'
import { computeReviewStreak } from '@/lib/home/streak'
import { buildTodayPayload, getOrCreatePlan } from '@/lib/planner/today'
import type { HomeData, HomeGoal } from '@/lib/types/home'

const STALE_DAYS = 7
const DAY_MS = 86_400_000

/**
 * One aggregated payload for the Today cockpit: plan, review state, due
 * learning, goal pulse, streak, and overdue count, all in the user's zone.
 */
export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    const tz = userTimezone(user)
    const now = new Date()
    const key = todayKey(tz, now)
    const hour = localHour(tz, now)
    const { start: today } = dayBoundsUtc(key)

    const dayPlan = await getOrCreatePlan(user, key)
    const plan = await buildTodayPayload(user, key, dayPlan)

    const [todayReview, recentReviews, overdueCount, goals, dueByDeck, readingBooks] =
      await Promise.all([
        prisma.dailyReview.findUnique({
          where: { userId_reviewDate: { userId: user.id, reviewDate: today } },
          select: { mood: true, tomorrowIntent: true },
        }),
        prisma.dailyReview.findMany({
          where: { userId: user.id, reviewDate: { gte: dateFromKey(addDays(key, -90)) } },
          select: { reviewDate: true, mood: true, tomorrowIntent: true },
          orderBy: { reviewDate: 'desc' },
        }),
        prisma.task.count({
          where: {
            userId: user.id,
            dueDate: { lt: today },
            status: { notIn: ['completed', 'cancelled'] },
          },
        }),
        prisma.goal.findMany({
          where: { userId: user.id, status: 'active' },
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
            updatedAt: true,
            tasks: { select: { status: true, completedAt: true, updatedAt: true } },
          },
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.flashcard.groupBy({
          by: ['deckId'],
          where: { userId: user.id, nextReviewAt: { lte: today } },
          _count: { _all: true },
        }),
        prisma.book.findMany({
          where: { userId: user.id, status: 'reading' },
          select: { id: true, title: true, author: true, pagesRead: true, pagesTotal: true },
          orderBy: { updatedAt: 'desc' },
          take: 3,
        }),
      ])

    const deckIds = dueByDeck.map((d) => d.deckId)
    const decks =
      deckIds.length > 0
        ? await prisma.deck.findMany({
            where: { id: { in: deckIds } },
            select: { id: true, name: true },
          })
        : []
    const deckNames = new Map(decks.map((d) => [d.id, d.name]))
    const decksDue = dueByDeck
      .map((d) => ({
        id: d.deckId,
        name: deckNames.get(d.deckId) ?? 'Deck',
        dueCount: d._count._all,
      }))
      .sort((a, b) => b.dueCount - a.dueCount)
    const cardsDue = decksDue.reduce((sum, d) => sum + d.dueCount, 0)

    const yesterdayKey = addDays(key, -1)
    const yesterdayReview = recentReviews.find((r) => keyFromDbDate(r.reviewDate) === yesterdayKey)
    const streak = computeReviewStreak(
      recentReviews.map((r) => keyFromDbDate(r.reviewDate)),
      key
    )

    const active: HomeGoal[] = goals.map((g) => {
      let last = g.updatedAt.getTime()
      for (const t of g.tasks) {
        const candidates = [t.completedAt?.getTime() ?? 0, t.updatedAt.getTime()]
        for (const c of candidates) if (c > last) last = c
      }
      return {
        id: g.id,
        title: g.title,
        category: g.category,
        taskCount: g.tasks.length,
        completedTaskCount: g.tasks.filter((t) => t.status === 'completed').length,
        lastActivityAt: new Date(last).toISOString(),
        daysSinceActivity: Math.max(0, Math.floor((now.getTime() - last) / DAY_MS)),
      }
    })
    const staleCount = active.filter((g) => g.daysSinceActivity >= STALE_DAYS).length

    const hasFocus = plan.focusTasks.length > 0
    const focusDone = hasFocus && plan.focusTasks.every((t) => t.status === 'completed')
    const reviewDone = !!todayReview && (!!todayReview.mood || !!todayReview.tomorrowIntent)

    const data: HomeData = {
      today: key,
      timezone: tz,
      hour,
      name: user.name ?? null,
      phase: dayPhase({ hour, hasFocus, focusDone, reviewDone }),
      plan: {
        focusTaskIds: plan.focusTaskIds,
        focusTasks: plan.focusTasks,
        tasksDueToday: plan.tasksDueToday,
        intentMd: plan.intentMd,
        carryForwardCount: plan.carryForward.length,
      },
      review: {
        todayDone: reviewDone,
        todayMood: todayReview?.mood ?? null,
        yesterday: yesterdayReview
          ? { mood: yesterdayReview.mood, tomorrowIntent: yesterdayReview.tomorrowIntent }
          : null,
      },
      learn: { cardsDue, decksDue, reading: readingBooks },
      goals: { active, staleCount },
      streak,
      overdueCount,
      focusMinutesToday: null,
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[home GET]', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})
