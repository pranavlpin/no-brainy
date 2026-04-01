export interface SM2Result {
  interval: number
  easeFactor: number
  state: 'learning' | 'review' | 'mastered'
}

export function nextReview(
  currentInterval: number,
  currentEaseFactor: number,
  rating: number // 0=Forgot, 1=Hard, 2=Medium, 3=Easy
): SM2Result {
  const easeFactor = Math.max(1.3, currentEaseFactor + (0.1 - (3 - rating) * 0.08))

  if (rating === 0) {
    return { interval: 1, easeFactor, state: 'learning' }
  }
  if (currentInterval === 0) {
    return { interval: 1, easeFactor, state: 'learning' }
  }
  if (currentInterval === 1) {
    return { interval: 6, easeFactor, state: 'review' }
  }

  const newInterval = Math.round(currentInterval * easeFactor)
  return {
    interval: newInterval,
    easeFactor,
    state: newInterval >= 21 ? 'mastered' : 'review',
  }
}
