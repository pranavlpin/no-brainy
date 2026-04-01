'use client'

import { useEffect, useState } from 'react'
import { QuickCaptureModal } from './quick-capture-modal'

export function QuickCaptureProvider() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return <QuickCaptureModal open={open} onClose={() => setOpen(false)} />
}
