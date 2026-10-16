'use client'

import { useEffect, useState } from 'react'

const QUERY = '(pointer: coarse)'

/** True on touch-first devices, where swipe gestures make sense. */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(QUERY)
    setCoarse(mql.matches)
    const onChange = (e: MediaQueryListEvent) => setCoarse(e.matches)
    mql.addEventListener?.('change', onChange)
    return () => mql.removeEventListener?.('change', onChange)
  }, [])
  return coarse
}
