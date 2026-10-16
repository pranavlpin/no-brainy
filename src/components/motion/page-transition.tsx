'use client'

import { motion } from 'framer-motion'

/** Fade and rise for route content. Used by the dashboard `template.tsx`. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
      className="min-h-full"
    >
      {children}
    </motion.div>
  )
}
