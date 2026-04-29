'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Link2, Tags } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NoteGraphView } from '@/components/notes/note-graph'
import { useNoteGraph, useTagGraph } from '@/hooks/use-backlinks'
import { cn } from '@/lib/utils'

type GraphView = 'links' | 'tags'

export default function NoteGraphPage(): React.ReactElement {
  const router = useRouter()
  const [view, setView] = useState<GraphView>('links')

  const { data: linkData, isLoading: linkLoading } = useNoteGraph()
  const { data: tagData, isLoading: tagLoading } = useTagGraph()

  const data = view === 'links' ? linkData : tagData
  const isLoading = view === 'links' ? linkLoading : tagLoading

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/notes')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Button>
          <h1 className="font-display text-2xl font-bold text-retro-dark">Note Graph</h1>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 border-2 border-retro-dark/15 bg-white p-1">
          <button
            onClick={() => setView('links')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-medium transition-colors',
              view === 'links'
                ? 'bg-retro-blue/10 text-retro-dark'
                : 'text-retro-dark/40 hover:text-retro-dark/70'
            )}
          >
            <Link2 className="h-3.5 w-3.5" />
            Links
          </button>
          <button
            onClick={() => setView('tags')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-medium transition-colors',
              view === 'tags'
                ? 'bg-retro-blue/10 text-retro-dark'
                : 'text-retro-dark/40 hover:text-retro-dark/70'
            )}
          >
            <Tags className="h-3.5 w-3.5" />
            Tags
          </button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {view === 'links'
          ? 'Notes connected by [[wiki-links]]. Click a node to open that note.'
          : 'Notes connected by shared tags. Notes with common tags are linked together.'}
      </p>

      {/* Graph */}
      {isLoading && (
        <Skeleton className="h-[600px] w-full" />
      )}

      {data && data.nodes.length > 0 && (
        <>
          <div className="font-mono text-xs text-muted-foreground">
            {data.nodes.length} notes &middot; {data.edges.length} connections
          </div>
          <NoteGraphView data={data} width={1100} height={600} />
        </>
      )}

      {data && data.nodes.length === 0 && (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-retro-dark/20 py-16 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            {view === 'links'
              ? 'No linked notes yet. Use /link in the editor to connect notes.'
              : 'No tagged notes yet. Add tags to your notes to see connections.'}
          </p>
        </div>
      )}
    </div>
  )
}
