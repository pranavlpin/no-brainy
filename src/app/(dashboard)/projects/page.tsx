'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, FolderKanban, Plus } from 'lucide-react'
import { useProjects, useCreateProject } from '@/hooks/use-projects'
import { useUIStore } from '@/stores/ui-store'
import { ProjectForm } from '@/components/projects/project-form'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/ui/workspace-states'
import type { ProjectStatus } from '@/lib/types/projects'

export default function ProjectsPage() {
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ProjectStatus | 'all'>('active')
  const context = useUIStore((state) => state.context)
  const projects = useProjects({ status, context, search })
  const create = useCreateProject()
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Turn intention into progress"
        title="Projects."
        description="Give each outcome a home, and one clear next step."
      >
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </PageHeader>
      <div className="flex flex-wrap gap-3">
        <Input
          aria-label="Search projects"
          placeholder="Find a project…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          aria-label="Project status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus | 'all')}
          className="sm:w-44"
        >
          <option value="active">Active projects</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
          <option value="all">All projects</option>
        </Select>
      </div>
      {projects.isLoading ? (
        <LoadingState label="Loading projects" />
      ) : projects.isError ? (
        <ErrorState retry={() => void projects.refetch()} />
      ) : !projects.data?.length ? (
        <EmptyState
          title="Room for something meaningful."
          description="Start with an outcome. You can add actions and supporting notes as you go."
          action="Start a project"
          onAction={() => setCreating(true)}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.data.map((project) => (
            <article
              key={project.id}
              data-testid={`project-${project.id}`}
              className="surface group flex flex-col p-6 transition duration-200 hover:-translate-y-1 hover:shadow-soft-lg"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <FolderKanban className="h-5 w-5" />
                </span>
                <span className="eyebrow">
                  {project.context} · {project.status}
                </span>
              </div>
              <Link
                href={`/projects/${project.id}`}
                className="flex items-start justify-between gap-3 text-xl font-semibold tracking-tight hover:text-primary"
              >
                {project.title}
                <ArrowUpRight aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground" />
              </Link>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                {project.outcome || 'Add a clear picture of what done looks like.'}
              </p>
              <div className="mt-auto pt-6">
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{
                      width: `${project.taskCount ? (project.completedTaskCount / project.taskCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {project.completedTaskCount} of {project.taskCount} actions complete
                </p>
                <p className="mt-4 truncate text-sm">
                  <span className="text-muted-foreground">Next: </span>
                  {project.nextAction?.title || 'Choose a small next step'}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
      <Dialog
        open={creating}
        onClose={() => setCreating(false)}
        title="New project"
        description="A meaningful outcome can start with one small action."
      >
        <ProjectForm
          initial={{ title: '', context: context === 'all' ? 'personal' : context }}
          onSave={async (data) => {
            await create.mutateAsync(data)
            setCreating(false)
          }}
        />
      </Dialog>
    </div>
  )
}
