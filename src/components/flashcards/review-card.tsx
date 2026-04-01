'use client'

import { cn } from '@/lib/utils'
import { MarkdownPreview } from '@/components/editor/markdown-preview'

interface ReviewCardProps {
  frontMd: string
  backMd: string
  isFlipped: boolean
  onFlip: () => void
}

export function ReviewCard({ frontMd, backMd, isFlipped, onFlip }: ReviewCardProps) {
  return (
    <div
      className="mx-auto w-full max-w-2xl cursor-pointer"
      style={{ perspective: '1200px' }}
      onClick={onFlip}
    >
      <div
        className={cn(
          'relative w-full min-h-[320px] transition-transform duration-500',
          '[transform-style:preserve-3d]',
          isFlipped && '[transform:rotateY(180deg)]'
        )}
      >
        {/* Front face */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-border bg-card p-8 shadow-lg [backface-visibility:hidden]">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Question
          </p>
          <div className="w-full text-center text-lg">
            <MarkdownPreview content={frontMd} />
          </div>
          <p className="mt-8 text-xs text-muted-foreground">Click to reveal answer</p>
        </div>

        {/* Back face */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-border bg-card p-8 shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Answer
          </p>
          <div className="w-full text-center text-lg">
            <MarkdownPreview content={backMd} />
          </div>
        </div>
      </div>
    </div>
  )
}
