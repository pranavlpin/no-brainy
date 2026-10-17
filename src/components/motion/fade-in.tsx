'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'

export interface FadeInProps extends HTMLMotionProps<'div'> {
  /** Delay in seconds before the element appears. */
  delay?: number
  /** Vertical offset in pixels to rise from. */
  rise?: number
}

/** Fade and rise an element into view on mount. */
export function FadeIn({ delay = 0, rise = 8, transition, ...props }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: rise }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1], delay, ...transition }}
      {...props}
    />
  )
}
