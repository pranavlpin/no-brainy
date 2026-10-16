import type { DayPhase } from '@/lib/home/phase'
import type { TaskResponse } from '@/lib/types/tasks'

export interface HomeGoal {
  id: string
  title: string
  category: string | null
  taskCount: number
  completedTaskCount: number
  lastActivityAt: string
  daysSinceActivity: number
}

export interface HomeData {
  /** Today's date key in the user's zone. */
  today: string
  timezone: string
  /** Local hour, 0 to 23, so the client and server agree on the phase. */
  hour: number
  name: string | null
  phase: DayPhase
  plan: {
    focusTaskIds: string[]
    focusTasks: TaskResponse[]
    tasksDueToday: TaskResponse[]
    intentMd: string | null
    carryForwardCount: number
  }
  review: {
    todayDone: boolean
    todayMood: string | null
    yesterday: { mood: string | null; tomorrowIntent: string | null } | null
  }
  learn: {
    cardsDue: number
    decksDue: { id: string; name: string; dueCount: number }[]
    reading: {
      id: string
      title: string
      author: string | null
      pagesRead: number
      pagesTotal: number | null
    }[]
  }
  goals: {
    active: HomeGoal[]
    staleCount: number
  }
  /** Consecutive days with a closed review. */
  streak: number
  overdueCount: number
  /** Deep-work minutes today; null until focus sessions are recorded. */
  focusMinutesToday: number | null
}
