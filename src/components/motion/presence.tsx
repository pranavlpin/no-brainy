'use client'

import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion'

export { AnimatePresence }

/** Animates height and opacity when a block mounts or unmounts. Wrap in `AnimatePresence`. */
export function Collapse(props: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
      style={{ overflow: 'hidden' }}
      {...props}
    />
  )
}

/** Pops a small element in with a scale bounce. */
export function Pop(props: HTMLMotionProps<'span'>) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 520, damping: 28 }}
      {...props}
    />
  )
}
