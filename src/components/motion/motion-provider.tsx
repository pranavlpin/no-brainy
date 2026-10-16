'use client'

import { MotionConfig } from 'framer-motion'

/** Shared easing for component-level motion. */
export const EASE_SMOOTH = [0.2, 0.8, 0.2, 1] as const

/** Shared spring for layout moves (pills, reorders). */
export const SPRING_LAYOUT = { type: 'spring', stiffness: 420, damping: 34 } as const

/**
 * App-wide motion defaults. Honors the OS reduced-motion preference by
 * disabling transform and layout animations while keeping opacity fades.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.22, ease: EASE_SMOOTH }}>
      {children}
    </MotionConfig>
  )
}
