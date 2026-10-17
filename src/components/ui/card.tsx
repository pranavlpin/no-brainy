import * as React from 'react'
import { cn } from '@/lib/utils'

export type CardVariant = 'glass' | 'solid' | 'outline'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  /** Lift the card 2 px with a deeper shadow on hover. */
  hoverLift?: boolean
  /** Remove the default padding. */
  flush?: boolean
}

/**
 * Surface container for the design system. `glass` is the default
 * translucent surface; `solid` is opaque; `outline` is a dashed placeholder.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'glass', hoverLift = false, flush = false, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl',
        `surface-${variant}`,
        hoverLift && 'hover-lift',
        !flush && 'p-5',
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

/** Small uppercase label used above card content. */
export function CardLabel({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-retro-dark/50',
        className
      )}
      {...props}
    />
  )
}
