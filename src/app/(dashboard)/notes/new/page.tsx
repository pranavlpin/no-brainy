'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'
import type { NoteResponse } from '@/lib/types/notes'

export default function NewNotePage() {
  const router = useRouter()
  const hasCreated = useRef(false)

  useEffect(() => {
    if (hasCreated.current) return
    hasCreated.current = true

    apiClient<ApiResponse<NoteResponse>>('/api/notes', {
      method: 'POST',
      body: JSON.stringify({ title: '', contentMd: '', tags: [], isPinned: false }),
    })
      .then((res) => {
        router.replace(`/notes/${res.data.id}`)
      })
      .catch(() => {
        router.replace('/notes')
      })
  }, [router])

  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span>Creating note...</span>
      </div>
    </div>
  )
}
