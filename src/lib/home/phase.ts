export type Greeting = 'Good morning' | 'Good afternoon' | 'Good evening' | 'Up late'

/** Greeting for a local hour (0 to 23). */
export function greetingFor(hour: number): Greeting {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 22) return 'Good evening'
  return 'Up late'
}

export type DayPhase = 'morning' | 'day' | 'evening' | 'closed'

export const EVENING_HOUR = 18

/**
 * Which part of the daily loop the Today page should lead with.
 * - `closed`: tonight's review is done.
 * - `evening`: after 18:00 local, or every focus task is done.
 * - `morning`: no focus chosen yet.
 * - `day`: working through the plan.
 */
export function dayPhase(input: {
  hour: number
  hasFocus: boolean
  focusDone: boolean
  reviewDone: boolean
}): DayPhase {
  if (input.reviewDone) return 'closed'
  if (input.hour >= EVENING_HOUR || (input.hasFocus && input.focusDone)) return 'evening'
  if (!input.hasFocus) return 'morning'
  return 'day'
}
