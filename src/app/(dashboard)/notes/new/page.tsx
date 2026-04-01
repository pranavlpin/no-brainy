'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateNote } from '@/hooks/use-notes'

export default function NewNotePage() {
  const router = useRouter()
  const createNote = useCreateNote()
  const hasCreated = useRef(false)

  useEffect(() => {
    if (hasCreated.current) return
    hasCreated.current = true

    createNote.mutate(
      { title: '', contentMd: '', tags: [], isPinned: false },
      {
        onSuccess: (note) => {
          router.replace(`/notes/${note.id}`)
        },
      }
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span>Creating note...</span>
      </div>
    </div>
  )
}
