'use client'

import type { ReactNode } from 'react'
import { ArrowRight, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from './button'
import { Skeleton } from './skeleton'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  icon?: ReactNode
  children?: ReactNode
  className?: string
}

/**
 * One page hierarchy everywhere: a small eyebrow, the display title, an
 * optional line of description, and actions that stay reachable on phones.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <div className="flex items-center gap-2">
          {icon}
          <h1 className="display-title">{title}</h1>
        </div>
        {description && <p className="mt-1.5 max-w-xl text-sm text-retro-dark/65">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  )
}

/** Announce loading once; the skeletons only sketch the layout. */
export function LoadingState({
  label = 'Loading your workspace',
  rows = 2,
}: {
  label?: string
  rows?: number
}) {
  return (
    <div role="status" className="space-y-3">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

/** A failed read stays visible with one explicit retry. */
export function ErrorState({
  retry,
  message = 'Could not load this part of your workspace.',
}: {
  retry: () => void
  message?: string
}) {
  return (
    <div role="alert" className="surface-outline rounded-2xl px-6 py-8 text-center">
      <p className="text-sm text-retro-dark/70">{message}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={retry}>
        <RefreshCw className="mr-1.5 h-4 w-4" />
        Try again
      </Button>
    </div>
  )
}

/** A kind empty state with at most one next step. */
export function EmptyState({
  title,
  description,
  action,
  onAction,
  icon,
}: {
  title: string
  description: string
  action?: string
  onAction?: () => void
  icon?: ReactNode
}) {
  return (
    <div className="surface-outline flex flex-col items-center rounded-2xl px-6 py-12 text-center">
      <span className="mb-3 text-retro-mint">{icon ?? <Sparkles className="h-8 w-8" />}</span>
      <p className="font-display text-lg font-semibold text-retro-dark">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && onAction && (
        <Button size="sm" className="mt-4" onClick={onAction}>
          {action}
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
