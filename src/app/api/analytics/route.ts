import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'

export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const eightWeeksAgo = new Date(now)
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

    // Run all queries in parallel
    const [
      allTasksLast30,
      tasksByPriorityRaw,
      notes,
      totalNotes,
      flashcardStates,
      reviewSessions,
      habitData,
      totalBooksRead,
      totalCardsReviewed,
    ] = await Promise.all([
      // Tasks in last 30 days (created or completed)
      prisma.task.findMany({
        where: {
          userId: user.id,
          OR: [
            { createdAt: { gte: thirtyDaysAgo } },
            { completedAt: { gte: thirtyDaysAgo } },
          ],
        },
        select: {
          id: true,
          status: true,
          priority: true,
          createdAt: true,
          completedAt: true,
        },
      }),

      // Tasks by priority (all time)
      prisma.task.groupBy({
        by: ['priority'],
        where: { userId: user.id },
        _count: { id: true },
      }),

      // Notes created in last 8 weeks
      prisma.note.findMany({
        where: {
          userId: user.id,
          isDeleted: false,
          createdAt: { gte: eightWeeksAgo },
        },
        select: { createdAt: true },
      }),

      // Total notes
      prisma.note.count({
        where: { userId: user.id, isDeleted: false },
      }),

      // Flashcard states
      prisma.flashcard.groupBy({
        by: ['state'],
        where: { userId: user.id },
        _count: { id: true },
      }),

      // Review sessions (last 90 days for streak calc)
      prisma.reviewSession.findMany({
        where: {
          userId: user.id,
          completedAt: { not: null },
        },
        select: { completedAt: true, cardsReviewed: true },
        orderBy: { completedAt: 'desc' },
      }),

      // Habit data for this month
      prisma.habit.findMany({
        where: { userId: user.id },
        include: {
          logs: {
            where: {
              logDate: { gte: startOfMonth },
            },
          },
        },
      }),

      // Total books read
      prisma.book.count({
        where: { userId: user.id, status: 'read' },
      }),

      // Total cards reviewed (sum)
      prisma.reviewSession.aggregate({
        where: { userId: user.id },
        _sum: { cardsReviewed: true },
      }),
    ])

    // Also get completed tasks by priority for the breakdown
    const completedByPriority = await prisma.task.groupBy({
      by: ['priority'],
      where: { userId: user.id, status: 'completed' },
      _count: { id: true },
    })

    // --- Task Completion Rate (last 30 days) ---
    const taskCompletionRate: { date: string; completed: number; total: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)

      const completedOnDay = allTasksLast30.filter((t) => {
        if (!t.completedAt) return false
        return t.completedAt.toISOString().slice(0, 10) === dateStr
      }).length

      const createdOnDay = allTasksLast30.filter(
        (t) => t.createdAt.toISOString().slice(0, 10) === dateStr
      ).length

      taskCompletionRate.push({
        date: dateStr,
        completed: completedOnDay,
        total: Math.max(createdOnDay, completedOnDay),
      })
    }

    // --- Tasks by Priority ---
    const priorities = ['urgent', 'high', 'medium', 'low']
    const completedMap = new Map(
      completedByPriority.map((r) => [r.priority, r._count.id])
    )
    const totalMap = new Map(
      tasksByPriorityRaw.map((r) => [r.priority, r._count.id])
    )

    const tasksByPriority = priorities.map((p) => ({
      priority: p,
      count: totalMap.get(p) ?? 0,
      completed: completedMap.get(p) ?? 0,
    }))

    // --- Tasks by Day of Week ---
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayBuckets: number[] = new Array(7).fill(0)
    allTasksLast30.forEach((t) => {
      if (t.completedAt) {
        dayBuckets[t.completedAt.getDay()]++
      }
    })
    // Reorder to Mon-Sun
    const tasksByDay = [1, 2, 3, 4, 5, 6, 0].map((idx) => ({
      day: dayNames[idx],
      count: dayBuckets[idx],
    }))

    // --- Notes per Week (last 8 weeks) ---
    const notesCreatedPerWeek: { week: string; count: number }[] = []
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - w * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const weekLabel = `W${weekStart.toISOString().slice(5, 10)}`
      const count = notes.filter(
        (n) => n.createdAt >= weekStart && n.createdAt < weekEnd
      ).length

      notesCreatedPerWeek.push({ week: weekLabel, count })
    }

    // --- Flashcard Stats ---
    const stateMap = new Map(
      flashcardStates.map((r) => [r.state, r._count.id])
    )
    const flashcardStats = {
      total:
        (stateMap.get('new') ?? 0) +
        (stateMap.get('learning') ?? 0) +
        (stateMap.get('review') ?? 0) +
        (stateMap.get('mastered') ?? 0),
      new: stateMap.get('new') ?? 0,
      learning: stateMap.get('learning') ?? 0,
      review: stateMap.get('review') ?? 0,
      mastered: stateMap.get('mastered') ?? 0,
    }

    // --- Review Streak ---
    let reviewStreak = 0
    if (reviewSessions.length > 0) {
      const reviewDates = new Set(
        reviewSessions
          .filter((s) => s.completedAt)
          .map((s) => s.completedAt!.toISOString().slice(0, 10))
      )

      const today = now.toISOString().slice(0, 10)
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().slice(0, 10)

      // Start counting from today or yesterday
      if (reviewDates.has(today) || reviewDates.has(yesterdayStr)) {
        const startDate = reviewDates.has(today) ? now : yesterday
        const checkDate = new Date(startDate)

        while (true) {
          const dateStr = checkDate.toISOString().slice(0, 10)
          if (reviewDates.has(dateStr)) {
            reviewStreak++
            checkDate.setDate(checkDate.getDate() - 1)
          } else {
            break
          }
        }
      }
    }

    // --- Habit Completion Rate ---
    let habitCompletionRate = 0
    if (habitData.length > 0) {
      const daysInMonth = now.getDate()
      // For daily habits, expected = daysInMonth per habit
      // Simplified: count completed logs / (habits * days so far)
      const totalExpected = habitData.length * daysInMonth
      const totalCompleted = habitData.reduce(
        (sum, h) => sum + h.logs.filter((l) => l.completed).length,
        0
      )
      habitCompletionRate =
        totalExpected > 0
          ? Math.round((totalCompleted / totalExpected) * 100)
          : 0
    }

    // --- Most Active Hours ---
    const hourBuckets: number[] = new Array(24).fill(0)
    allTasksLast30.forEach((t) => {
      if (t.completedAt) {
        hourBuckets[t.completedAt.getHours()]++
      }
    })
    const mostActiveHours = hourBuckets.map((count, hour) => ({
      hour,
      count,
    }))

    // --- Totals ---
    const totalTasksCompleted = allTasksLast30.filter(
      (t) => t.status === 'completed'
    ).length

    return NextResponse.json({
      success: true,
      data: {
        taskCompletionRate,
        tasksByPriority,
        tasksByDay,
        notesCreatedPerWeek,
        totalNotes,
        flashcardStats,
        reviewStreak,
        habitCompletionRate,
        mostActiveHours,
        totalTasksCompleted,
        totalBooksRead,
        totalCardsReviewed: totalCardsReviewed._sum.cardsReviewed ?? 0,
      },
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
})
