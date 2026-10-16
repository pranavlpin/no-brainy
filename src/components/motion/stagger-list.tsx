'use client'

import { motion, type HTMLMotionProps, type Variants } from 'framer-motion'

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.02 } },
}

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] } },
}

/** Container that staggers the entrance of its `StaggerItem` children. */
export function StaggerList(props: HTMLMotionProps<'ul'>) {
  return <motion.ul variants={containerVariants} initial="hidden" animate="show" {...props} />
}

/** Grid or block container variant of `StaggerList`. */
export function StaggerGroup(props: HTMLMotionProps<'div'>) {
  return <motion.div variants={containerVariants} initial="hidden" animate="show" {...props} />
}

/** Child of `StaggerList` / `StaggerGroup`. */
export function StaggerItem(props: HTMLMotionProps<'li'>) {
  return <motion.li variants={staggerItemVariants} {...props} />
}

/** Block child of `StaggerGroup`. */
export function StaggerBlock(props: HTMLMotionProps<'div'>) {
  return <motion.div variants={staggerItemVariants} {...props} />
}
