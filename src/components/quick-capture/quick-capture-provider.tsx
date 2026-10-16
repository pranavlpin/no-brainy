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
    const openCapture = () => setOpen(true)
    window.addEventListener('nobrainy:capture', openCapture)
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      window.removeEventListener('nobrainy:capture', openCapture)
    }
  }, [])

  return <QuickCaptureModal open={open} onClose={() => setOpen(false)} />
}
