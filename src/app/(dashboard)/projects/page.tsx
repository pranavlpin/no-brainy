'use client'

import { useState } from 'react'
import { FolderKanban, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StaggerBlock, StaggerGroup } from '@/components/motion'
import { ProjectCard } from '@/components/projects/project-card'
import { ProjectForm } from '@/components/projects/project-form'
import { useCreateProject, useProjects } from '@/hooks/use-projects'
import type { ProjectStatus } from '@/lib/types/projects'

export default function ProjectsPage() {
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ProjectStatus | 'all'>('active')
  const projects = useProjects({ status, search: search || undefined })
  const create = useCreateProject()

  return (
    <StaggerGroup className="space-y-6">
      <StaggerBlock>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-retro-blue" />
              <h1 className="font-display text-2xl font-bold text-retro-dark">Projects</h1>
            </div>
            <p className="mt-1 font-mono text-sm text-retro-dark/60">
              Each outcome gets a home and one clear next step.
            </p>
          </div>
          <Button size="sm" onClick={() => setCreating(true)} data-testid="project-new">
            <Plus className="mr-1.5 h-4 w-4" />
            New project
          </Button>
        </div>
      </StaggerBlock>

      <StaggerBlock>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            aria-label="Search projects"
            placeholder="Find a project…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-64"
          />
          <Select
            aria-label="Project status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus | 'all')}
            className="sm:w-44"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </Select>
        </div>
      </StaggerBlock>

      <StaggerBlock>
        {projects.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          </div>
        ) : projects.isError ? (
          <div className="surface-outline rounded-2xl p-6 text-center text-sm">
            Projects could not load.{' '}
            <button className="text-retro-blue underline" onClick={() => void projects.refetch()}>
              Retry
            </button>
          </div>
        ) : !projects.data?.length ? (
          <div className="surface-outline rounded-2xl px-6 py-12 text-center">
            <FolderKanban className="mx-auto h-8 w-8 text-retro-blue/60" />
            <p className="mt-3 font-display text-lg font-semibold text-retro-dark">
              Room for something meaningful.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start with an outcome. Actions and notes can come as you go.
            </p>
            <Button className="mt-4" size="sm" onClick={() => setCreating(true)}>
              Start a project
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.data.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </StaggerBlock>

      <Dialog
        open={creating}
        onClose={() => setCreating(false)}
        title="New project"
        description="A meaningful outcome can start with one small action."
      >
        <ProjectForm
          onSave={async (data) => {
            await create.mutateAsync(data)
            setCreating(false)
          }}
        />
      </Dialog>
    </StaggerGroup>
  )
}
