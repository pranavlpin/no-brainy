'use client'

import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import { usePrefersReducedMotion } from './use-prefers-reduced-motion'

export interface AnimatedNumberProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  'children'
> {
  value: number
  /** Format the in-flight value. Defaults to rounded en-IN grouping. */
  format?: (value: number) => string
  /** Seconds for the count animation. */
  duration?: number
}

const defaultFormat = (v: number) => Math.round(v).toLocaleString('en-IN')

/** Counts from the previous value to the new one; instant under reduced motion. */
export function AnimatedNumber({
  value,
  format = defaultFormat,
  duration = 0.7,
  ...props
}: AnimatedNumberProps) {
  const reduced = usePrefersReducedMotion()
  const [display, setDisplay] = useState(() => format(value))
  const previous = useRef(value)

  useEffect(() => {
    if (reduced) {
      setDisplay(format(value))
      previous.current = value
      return
    }
    const controls = animate(previous.current, value, {
      duration,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => setDisplay(format(v)),
    })
    previous.current = value
    return () => controls.stop()
  }, [value, reduced, duration, format])

  return (
    <span className="tabular-nums" {...props}>
      {display}
    </span>
  )
}
