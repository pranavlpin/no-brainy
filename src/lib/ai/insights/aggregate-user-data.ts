import { prisma } from '@/lib/prisma'

export interface UserDataSummary {
  tasks: {
    total: number
    completedLast30Days: number
    overdueCount: number
    overdueTasks: Array<{ title: string; dueDate: string; daysPastDue: number }>
    completionByPriority: Record<string, { total: number; completed: number }>
    completionByDayOfWeek: Record<string, number>
    completionTimestamps: string[]
  }
  notes: {
    totalCreatedLast30Days: number
    tagFrequency: Record<string, number>
    creationTimestamps: string[]
  }
  flashcards: {
    totalReviewed: number
    forgotRate: number
    weakTags: Array<{ tag: string; forgotCount: number }>
    reviewStreak: number
  }
  habits: {
    habits: Array<{
      title: string
      frequency: string
      currentStreak: number
      completionRate30d: number
    }>
  }
}

export async function aggregateUserData(userId: string): Promise<UserDataSummary> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Run queries in parallel
  const [
    allTasks,
    completedTasks,
    overdueTasks,
    notes,
    reviewSessions,
    flashcards,
    habits,
    habitLogs,
  ] = await Promise.all([
    // All user tasks
    prisma.task.findMany({
      where: { userId },
      select: { id: true, title: true, priority: true, status: true, dueDate: true, completedAt: true, createdAt: true },
    }),
    // Tasks completed in last 30 days
    prisma.task.findMany({
      where: { userId, status: 'completed', completedAt: { gte: thirtyDaysAgo } },
      select: { id: true, title: true, priority: true, completedAt: true },
    }),
    // Overdue tasks
    prisma.task.findMany({
      where: { userId, status: { not: 'completed' }, dueDate: { lt: now } },
      select: { id: true, title: true, dueDate: true },
    }),
    // Notes created in last 30 days
    prisma.note.findMany({
      where: { userId, isDeleted: false, createdAt: { gte: thirtyDaysAgo } },
      select: { id: true, tags: true, createdAt: true },
    }),
    // Review sessions in last 30 days
    prisma.reviewSession.findMany({
      where: { userId, startedAt: { gte: thirtyDaysAgo } },
      select: { startedAt: true, cardsReviewed: true, cardsForgot: true, cardsEasy: true, cardsMedium: true, cardsHard: true },
    }),
    // User flashcards with learning state
    prisma.flashcard.findMany({
      where: { userId, state: 'learning' },
      select: { tags: true, reviewCount: true, lastRating: true },
    }),
    // Habits
    prisma.habit.findMany({
      where: { userId },
      select: { id: true, title: true, frequency: true },
    }),
    // Habit logs in last 30 days
    prisma.habitLog.findMany({
      where: {
        habit: { userId },
        logDate: { gte: thirtyDaysAgo },
      },
      select: { habitId: true, logDate: true, completed: true },
    }),
  ])

  // --- Tasks aggregation ---
  const completionByPriority: Record<string, { total: number; completed: number }> = {}
  for (const task of allTasks) {
    const p = task.priority
    if (!completionByPriority[p]) {
      completionByPriority[p] = { total: 0, completed: 0 }
    }
    completionByPriority[p].total++
    if (task.status === 'completed') {
      completionByPriority[p].completed++
    }
  }

  const completionByDayOfWeek: Record<string, number> = {}
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  for (const task of completedTasks) {
    if (task.completedAt) {
      const day = dayNames[task.completedAt.getDay()]
      completionByDayOfWeek[day] = (completionByDayOfWeek[day] || 0) + 1
    }
  }

  const completionTimestamps = completedTasks
    .filter((t) => t.completedAt)
    .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())
    .slice(0, 50)
    .map((t) => t.completedAt!.toISOString())

  const overdueTasksData = overdueTasks.map((t) => ({
    title: t.title,
    dueDate: t.dueDate!.toISOString(),
    daysPastDue: Math.floor((now.getTime() - t.dueDate!.getTime()) / (24 * 60 * 60 * 1000)),
  }))

  // --- Notes aggregation ---
  const tagFrequency: Record<string, number> = {}
  for (const note of notes) {
    for (const tag of note.tags) {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1
    }
  }

  const creationTimestamps = notes
    .map((n) => n.createdAt.toISOString())
    .sort()
    .reverse()

  // --- Flashcard aggregation ---
  const totalReviewed = reviewSessions.reduce((sum, s) => sum + s.cardsReviewed, 0)
  const totalForgot = reviewSessions.reduce((sum, s) => sum + s.cardsForgot, 0)
  const forgotRate = totalReviewed > 0 ? Math.round((totalForgot / totalReviewed) * 100) : 0

  // Weak tags from learning-state cards
  const tagForgotCount: Record<string, number> = {}
  for (const card of flashcards) {
    if (card.lastRating === 'forgot' || card.lastRating === 'hard') {
      for (const tag of card.tags) {
        tagForgotCount[tag] = (tagForgotCount[tag] || 0) + 1
      }
    }
  }
  const weakTags = Object.entries(tagForgotCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, forgotCount]) => ({ tag, forgotCount }))

  // Review streak: consecutive days with review sessions
  const reviewDates = new Set(
    reviewSessions.map((s) => s.startedAt.toISOString().split('T')[0])
  )
  let reviewStreak = 0
  const checkDate = new Date(now)
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0]
    if (reviewDates.has(dateStr)) {
      reviewStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  // --- Habits aggregation ---
  const habitData = habits.map((habit) => {
    const logs = habitLogs.filter((l) => l.habitId === habit.id)
    const completedLogs = logs.filter((l) => l.completed)
    const completionRate30d = logs.length > 0
      ? Math.round((completedLogs.length / logs.length) * 100)
      : 0

    // Calculate current streak
    let currentStreak = 0
    const sortedLogs = logs
      .filter((l) => l.completed)
      .sort((a, b) => b.logDate.getTime() - a.logDate.getTime())

    if (sortedLogs.length > 0) {
      const streakDate = new Date(now)
      for (const log of sortedLogs) {
        const logDateStr = log.logDate.toISOString().split('T')[0]
        const checkStr = streakDate.toISOString().split('T')[0]
        if (logDateStr === checkStr) {
          currentStreak++
          streakDate.setDate(streakDate.getDate() - 1)
        } else {
          break
        }
      }
    }

    return {
      title: habit.title,
      frequency: habit.frequency,
      currentStreak,
      completionRate30d,
    }
  })

  return {
    tasks: {
      total: allTasks.length,
      completedLast30Days: completedTasks.length,
      overdueCount: overdueTasks.length,
      overdueTasks: overdueTasksData,
      completionByPriority,
      completionByDayOfWeek,
      completionTimestamps,
    },
    notes: {
      totalCreatedLast30Days: notes.length,
      tagFrequency,
      creationTimestamps,
    },
    flashcards: {
      totalReviewed,
      forgotRate,
      weakTags,
      reviewStreak,
    },
    habits: {
      habits: habitData,
    },
  }
}
