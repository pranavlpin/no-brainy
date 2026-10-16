'use client'

import type { ReactNode } from 'react'
import { ArrowRight, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from './button'
import { Skeleton } from './skeleton'

/** Consistent page hierarchy with actions that remain reachable on narrow screens. */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="display-title">{title}</h1>
        {description && (
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  )
}

/** Announce loading once while decorative skeletons communicate the eventual layout. */
export function LoadingState({ label = 'Loading your workspace' }: { label?: string }) {
  return (
    <div role="status" className="space-y-4">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
    </div>
  )
}

/** Keep failed reads visible with an explicit retry action. */
export function ErrorState({
  retry,
  message = 'Could not load this part of your workspace.',
}: {
  retry: () => void
  message?: string
}) {
  return (
    <div role="alert" className="surface p-7 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" className="mt-4 gap-2" onClick={retry}>
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  )
}

/** Friendly empty state with a single optional next step. */
export function EmptyState({
  title,
  description,
  action,
  onAction,
}: {
  title: string
  description: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="surface-soft flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-5 rounded-2xl bg-secondary p-4 text-primary">
        <Sparkles className="h-6 w-6" />
      </span>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {action && onAction && (
        <Button className="mt-6 gap-3" onClick={onAction}>
          {action}
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
