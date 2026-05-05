import { prisma } from '@/lib/prisma'

export interface UserDataSummary {
  expenses: {
    totalSpent30d: number
    transactionCount30d: number
    topCategories: Array<{ name: string; total: number; count: number }>
    avgPerTransaction: number
    highestSingle: { name: string; amount: number; date: string } | null
    monthOverMonthChange: number | null
    dailyAverage: number
  }
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
  goals: {
    activeGoals: Array<{ title: string; category: string | null; taskCount: number; completedTaskCount: number; progressPct: number; targetDate: string | null; isOverdue: boolean }>
    totalGoals: number
    completedGoals: number
  }
  budgets: {
    activeBudgets: Array<{ name: string; type: string; category: string; amount: number; spent: number; percentage: number; period: string; status: string }>
    totalOverBudget: number
    totalOnTrack: number
  }
}

export type InsightModule = 'tasks' | 'notes' | 'flashcards' | 'expenses' | 'goals' | 'budgets'

export const ALL_INSIGHT_MODULES: { key: InsightModule; label: string; icon: string }[] = [
  { key: 'expenses', label: 'Expenses', icon: 'wallet' },
  { key: 'budgets', label: 'Budgets', icon: 'piggy-bank' },
  { key: 'tasks', label: 'Tasks', icon: 'check-square' },
  { key: 'goals', label: 'Goals', icon: 'target' },
  { key: 'notes', label: 'Notes', icon: 'file-text' },
  { key: 'flashcards', label: 'Flashcards', icon: 'layers' },
]

export async function aggregateUserData(userId: string, modules?: InsightModule[], dateFrom?: string, dateTo?: string): Promise<Partial<UserDataSummary>> {
  const selected = modules ?? ALL_INSIGHT_MODULES.map((m) => m.key)
  const now = dateTo ? new Date(dateTo) : new Date()
  const thirtyDaysAgo = dateFrom ? new Date(dateFrom) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const rangeDays = Math.max(1, Math.round((now.getTime() - thirtyDaysAgo.getTime()) / (24 * 60 * 60 * 1000)))
  const sixtyDaysAgo = new Date(thirtyDaysAgo.getTime() - rangeDays * 24 * 60 * 60 * 1000)

  // Only query modules the user selected
  const emptyArr: never[] = []

  const [
    allTasks,
    completedTasks,
    overdueTasks,
    notes,
    reviewSessions,
    flashcards,
    recentExpenses,
    prevMonthExpenses,
  ] = await Promise.all([
    selected.includes('tasks') ? prisma.task.findMany({
      where: { userId },
      select: { id: true, title: true, priority: true, status: true, dueDate: true, completedAt: true, createdAt: true },
    }) : emptyArr,
    selected.includes('tasks') ? prisma.task.findMany({
      where: { userId, status: 'completed', completedAt: { gte: thirtyDaysAgo } },
      select: { id: true, title: true, priority: true, completedAt: true },
    }) : emptyArr,
    selected.includes('tasks') ? prisma.task.findMany({
      where: { userId, status: { not: 'completed' }, dueDate: { lt: now } },
      select: { id: true, title: true, dueDate: true },
    }) : emptyArr,
    selected.includes('notes') ? prisma.note.findMany({
      where: { userId, isDeleted: false, createdAt: { gte: thirtyDaysAgo } },
      select: { id: true, tags: true, createdAt: true },
    }) : emptyArr,
    selected.includes('flashcards') ? prisma.reviewSession.findMany({
      where: { userId, startedAt: { gte: thirtyDaysAgo } },
      select: { startedAt: true, cardsReviewed: true, cardsForgot: true, cardsEasy: true, cardsMedium: true, cardsHard: true },
    }) : emptyArr,
    selected.includes('flashcards') ? prisma.flashcard.findMany({
      where: { userId, state: 'learning' },
      select: { tags: true, reviewCount: true, lastRating: true },
    }) : emptyArr,
    selected.includes('expenses') ? prisma.expense.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      select: { name: true, amount: true, date: true, categoryId: true, category: { select: { name: true } } },
    }) : emptyArr,
    selected.includes('expenses') ? prisma.expense.findMany({
      where: { userId, date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      select: { amount: true },
    }) : emptyArr,
  ])

  // Additional queries for goals and budgets (separate to keep Promise.all clean)
  let goalsData: Array<{ title: string; category: string | null; status: string; targetDate: Date | null; _count: { tasks: number }; tasks: Array<{ status: string }> }> = []
  let budgetsData: Array<{ name: string; type: string; amount: unknown; period: string; categoryId: string; category: { name: string } }> = []

  if (selected.includes('goals')) {
    goalsData = await prisma.goal.findMany({
      where: { userId },
      select: { title: true, category: true, status: true, targetDate: true, _count: { select: { tasks: true } }, tasks: { select: { status: true } } },
    })
  }

  if (selected.includes('budgets')) {
    budgetsData = await prisma.budget.findMany({
      where: { userId, isActive: true },
      include: { category: { select: { name: true } } },
    }) as unknown as typeof budgetsData
  }

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

  // --- Expenses aggregation ---
  const totalSpent30d = recentExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const prevTotal = prevMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  const categoryTotals = new Map<string, { name: string; total: number; count: number }>()
  for (const exp of recentExpenses) {
    const catName = exp.category?.name ?? 'Unknown'
    const existing = categoryTotals.get(catName) ?? { name: catName, total: 0, count: 0 }
    existing.total += Number(exp.amount)
    existing.count++
    categoryTotals.set(catName, existing)
  }
  const topCategories = Array.from(categoryTotals.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  let highestSingle: { name: string; amount: number; date: string } | null = null
  for (const exp of recentExpenses) {
    const amt = Number(exp.amount)
    if (!highestSingle || amt > highestSingle.amount) {
      highestSingle = { name: exp.name, amount: amt, date: exp.date.toISOString().split('T')[0] }
    }
  }

  const monthOverMonthChange = prevTotal > 0
    ? Math.round(((totalSpent30d - prevTotal) / prevTotal) * 100)
    : null

  const result: Partial<UserDataSummary> = {}

  if (selected.includes('expenses')) {
    result.expenses = {
      totalSpent30d,
      transactionCount30d: recentExpenses.length,
      topCategories,
      avgPerTransaction: recentExpenses.length > 0 ? Math.round(totalSpent30d / recentExpenses.length) : 0,
      highestSingle,
      monthOverMonthChange,
      dailyAverage: Math.round(totalSpent30d / rangeDays),
    }
  }

  if (selected.includes('tasks')) {
    result.tasks = {
      total: allTasks.length,
      completedLast30Days: completedTasks.length,
      overdueCount: overdueTasks.length,
      overdueTasks: overdueTasksData,
      completionByPriority,
      completionByDayOfWeek,
      completionTimestamps,
    }
  }

  if (selected.includes('notes')) {
    result.notes = {
      totalCreatedLast30Days: notes.length,
      tagFrequency,
      creationTimestamps,
    }
  }

  if (selected.includes('flashcards')) {
    result.flashcards = {
      totalReviewed,
      forgotRate,
      weakTags,
      reviewStreak,
    }
  }


  if (selected.includes('goals') && goalsData.length > 0) {
    const activeGoals = goalsData
      .filter((g) => g.status === 'active')
      .map((g) => {
        const taskCount = g._count.tasks
        const completedTaskCount = g.tasks.filter((t) => t.status === 'completed').length
        const progressPct = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0
        const isOverdue = g.targetDate ? new Date(g.targetDate) < now && g.status === 'active' : false
        return {
          title: g.title,
          category: g.category,
          taskCount,
          completedTaskCount,
          progressPct,
          targetDate: g.targetDate?.toISOString().split('T')[0] ?? null,
          isOverdue,
        }
      })

    result.goals = {
      activeGoals,
      totalGoals: goalsData.length,
      completedGoals: goalsData.filter((g) => g.status === 'completed').length,
    }
  }

  if (selected.includes('budgets') && budgetsData.length > 0) {
    // Calculate spend for each budget in current period
    const budgetResults = await Promise.all(
      budgetsData.map(async (b) => {
        const periodStart = b.period === 'monthly'
          ? new Date(now.getFullYear(), now.getMonth(), 1)
          : b.period === 'quarterly'
          ? new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
          : b.period === 'yearly'
          ? new Date(now.getFullYear(), 0, 1)
          : thirtyDaysAgo

        const spentResult = await prisma.expense.aggregate({
          where: { userId, categoryId: b.categoryId, date: { gte: periodStart, lte: now } },
          _sum: { amount: true },
        })

        const spent = Number(spentResult._sum.amount ?? 0)
        const amount = Number(b.amount)
        const percentage = amount > 0 ? Math.round((spent / amount) * 100) : 0

        return {
          name: b.name,
          type: b.type,
          category: b.category.name,
          amount,
          spent: Math.round(spent),
          percentage,
          period: b.period,
          status: b.type === 'limit'
            ? (spent > amount ? 'OVER BUDGET' : spent > amount * 0.75 ? 'WARNING' : 'ON TRACK')
            : (spent >= amount ? 'COMPLETED' : 'IN PROGRESS'),
        }
      })
    )

    result.budgets = {
      activeBudgets: budgetResults,
      totalOverBudget: budgetResults.filter((b) => b.status === 'OVER BUDGET').length,
      totalOnTrack: budgetResults.filter((b) => b.status === 'ON TRACK' || b.status === 'IN PROGRESS').length,
    }
  }

  return result
}
