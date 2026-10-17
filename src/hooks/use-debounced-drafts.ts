'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Local drafts for free-text fields that save in the background.
 *
 * Each field keeps the latest typed value and saves it once, `delay` ms after
 * the last change. The draft is never replaced by a later server echo, so a
 * slow response cannot wipe what the user typed in the meantime. Pending
 * drafts are flushed when the component unmounts.
 */
export function useDebouncedDrafts<T extends Record<string, string>>(
  save: (patch: Partial<T>) => void,
  delay = 600
) {
  const [drafts, setDrafts] = useState<Partial<T>>({})
  const timers = useRef(new Map<keyof T, ReturnType<typeof setTimeout>>())
  const pending = useRef(new Map<keyof T, T[keyof T]>())
  const saveRef = useRef(save)
  saveRef.current = save

  const flushField = useCallback((field: keyof T) => {
    const timer = timers.current.get(field)
    if (timer) clearTimeout(timer)
    timers.current.delete(field)
    if (!pending.current.has(field)) return
    const value = pending.current.get(field) as T[keyof T]
    pending.current.delete(field)
    saveRef.current({ [field]: value } as Partial<T>)
  }, [])

  const change = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      setDrafts((current) => ({ ...current, [field]: value }))
      pending.current.set(field, value)
      const timer = timers.current.get(field)
      if (timer) clearTimeout(timer)
      timers.current.set(
        field,
        setTimeout(() => flushField(field), delay)
      )
    },
    [delay, flushField]
  )

  const flush = useCallback(() => {
    for (const field of Array.from(pending.current.keys())) flushField(field)
  }, [flushField])

  useEffect(() => () => flush(), [flush])

  return { drafts, change, flush }
}
