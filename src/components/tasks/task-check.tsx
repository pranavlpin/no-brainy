'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface TaskCheckProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Accessible label, usually the task title. */
  label: string
  size?: 'sm' | 'md'
  className?: string
  'data-testid'?: string
  disabled?: boolean
}

const SIZES = { sm: 'h-4 w-4', md: 'h-5 w-5' } as const

/**
 * Animated task checkbox: the ring fills and the check draws itself.
 * Renders a real `role="checkbox"` button so it is keyboard and screen-reader friendly.
 */
export function TaskCheck({
  checked,
  onChange,
  label,
  size = 'md',
  className,
  disabled,
  ...rest
}: TaskCheckProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? `Mark "${label}" as not done` : `Mark "${label}" as done`}
      disabled={disabled}
      data-testid={rest['data-testid']}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      className={cn(
        'group/check relative inline-flex shrink-0 items-center justify-center rounded-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-retro-blue focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        SIZES[size],
        className
      )}
    >
      <motion.span
        aria-hidden
        className={cn(
          'absolute inset-0 rounded-full border-2',
          checked ? 'border-retro-mint bg-retro-mint' : 'border-retro-dark/30 bg-transparent'
        )}
        initial={false}
        animate={{ scale: checked ? [1, 1.18, 1] : 1 }}
        transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
      />
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full bg-retro-dark/5 opacity-0 transition-opacity group-hover/check:opacity-100"
      />
      <svg viewBox="0 0 24 24" className="relative h-[70%] w-[70%]" fill="none">
        <motion.path
          d="M5 12.5l4.2 4.2L19 7.5"
          stroke="white"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </svg>
    </button>
  )
}
