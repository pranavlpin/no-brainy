import type { TaskPriority } from '@/lib/types/tasks'

const RANK: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

/** Numeric rank for ordering: 0 is most urgent. Unknown labels rank as medium. */
export function priorityRank(priority: string | null | undefined): number {
  return priority && priority in RANK ? RANK[priority as TaskPriority] : RANK.medium
}
