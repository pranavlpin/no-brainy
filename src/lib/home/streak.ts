import { addDays } from '@/lib/dates'

/**
 * Consecutive reviewed days ending today or yesterday. A review for today
 * extends the run; a missing today does not break a run that ended yesterday.
 */
export function computeReviewStreak(reviewDateKeys: string[], today: string): number {
  const set = new Set(reviewDateKeys)
  let cursor = set.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (set.has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}
