'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NoteGraphView } from '@/components/notes/note-graph'
import { useNoteGraph } from '@/hooks/use-backlinks'

export default function NoteGraphPage() {
  const router = useRouter()
  const { data, isLoading } = useNoteGraph()

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/notes')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Note Graph</h1>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Visualize connections between your notes. Click a node to navigate to that note. Drag nodes to reposition. Scroll to zoom, drag background to pan.
      </p>

      {/* Graph */}
      {isLoading && (
        <Skeleton className="h-[600px] w-full rounded-lg" />
      )}

      {data && (
        <NoteGraphView data={data} width={1100} height={600} />
      )}
    </div>
  )
}
