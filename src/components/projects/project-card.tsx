'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, FolderKanban } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ProjectResponse } from '@/lib/types/projects'

const STATUS_TONE: Record<ProjectResponse['status'], 'blue' | 'yellow' | 'green' | 'gray'> = {
  active: 'blue',
  paused: 'yellow',
  completed: 'green',
  archived: 'gray',
}

/** One project: outcome, progress, and the next action, on a glass surface. */
export function ProjectCard({ project }: { project: ProjectResponse }) {
  const pct = project.taskCount ? Math.round((project.completedTaskCount / project.taskCount) * 100) : 0
  return (
    <motion.article
      layout
      data-testid={`project-${project.id}`}
      className="surface-glass hover-lift group flex flex-col rounded-2xl p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-retro-blue/15">
          <FolderKanban className="h-4 w-4 text-retro-blue" />
        </span>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            {project.context}
          </Badge>
          {project.status !== 'active' && (
            <Badge variant={STATUS_TONE[project.status]} className="text-[10px]">
              {project.status}
            </Badge>
          )}
        </div>
      </div>
      <Link
        href={`/projects/${project.id}`}
        className="flex items-start justify-between gap-2 font-display text-lg font-semibold leading-snug text-retro-dark hover:text-retro-blue"
      >
        {project.title}
        <ArrowUpRight aria-hidden className="mt-1 h-4 w-4 shrink-0 text-retro-dark/40" />
      </Link>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
        {project.outcome || 'Add a clear picture of what done looks like.'}
      </p>
      <div className="mt-auto pt-5">
        <div className="h-1.5 overflow-hidden rounded-full bg-retro-dark/10">
          <motion.div
            className={cn(
              'h-full rounded-full',
              pct >= 100 ? 'bg-retro-mint' : 'bg-gradient-to-r from-retro-blue to-retro-mint'
            )}
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          />
        </div>
        <p className="mt-1.5 font-mono text-[11px] text-retro-dark/60">
          {project.completedTaskCount} of {project.taskCount} done
        </p>
        <p className="mt-3 truncate text-sm text-retro-dark" data-testid="project-next-action">
          <span className="font-mono text-[11px] uppercase tracking-wide text-retro-dark/50">
            Next:{' '}
          </span>
          {project.nextAction?.title ?? (
            <span className="text-retro-dark/50">Choose a next step</span>
          )}
        </p>
      </div>
    </motion.article>
  )
}
