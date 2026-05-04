import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MarkdownPreview } from '@/components/editor/markdown-preview'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ shareId: string }>
}

async function getNote(shareId: string) {
  const note = await prisma.note.findFirst({
    where: { shareId, isPublic: true, isDeleted: false },
    select: { title: true, contentMd: true, tags: true, updatedAt: true },
  })
  return note
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareId } = await params
  const note = await getNote(shareId)
  if (!note) return { title: 'Note Not Found' }

  const description = note.contentMd
    .replace(/[#*_~`\[\]()>]/g, '')
    .slice(0, 160)
    .trim()

  return {
    title: note.title || 'Shared Note',
    description,
    openGraph: {
      title: note.title || 'Shared Note',
      description,
      type: 'article',
    },
  }
}

export default async function SharedNotePage({ params }: PageProps) {
  const { shareId } = await params
  const note = await getNote(shareId)

  if (!note) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* Title */}
        <h1 className="font-display text-3xl font-bold text-retro-dark mb-2">
          {note.title || 'Untitled'}
        </h1>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-retro-blue/10 px-2.5 py-0.5 font-mono text-xs text-retro-blue"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Date */}
        <p className="font-mono text-xs text-retro-dark/40 mb-8">
          Last updated {new Date(note.updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        {/* Content */}
        <article className="border-t-2 border-retro-dark/10 pt-8">
          <MarkdownPreview content={note.contentMd} />
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-retro-dark/10 py-6 text-center">
        <a
          href="https://nobrainy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-retro-dark/30 hover:text-retro-dark/60 transition-colors"
        >
          Powered by NoBrainy
        </a>
      </footer>
    </div>
  )
}
