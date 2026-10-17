'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Check, CloudOff, Loader2, RefreshCw } from 'lucide-react'
import type { SaveState } from '@/lib/drafts/draft-save'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SaveStatusProps {
  state: SaveState
  durable: boolean
  retry: () => void
  resolve: (keep: boolean) => Promise<void>
  className?: string
}

const COPY: Record<SaveState, string> = {
  saved: 'Saved',
  pending: 'Unsaved changes',
  saving: 'Saving…',
  error: 'Could not save. Your draft is kept.',
  conflict: 'Changed elsewhere. Choose which version to keep.',
}

/** Truthful save feedback with recovery actions; never says Saved when it is not. */
export function SaveStatus({ state, durable, retry, resolve, className }: SaveStatusProps) {
  const [resolving, setResolving] = useState(false)
  const [failed, setFailed] = useState(false)

  const decide = async (keep: boolean) => {
    setResolving(true)
    setFailed(false)
    try {
      await resolve(keep)
    } catch {
      setFailed(true)
    } finally {
      setResolving(false)
    }
  }

  const Icon =
    state === 'saved'
      ? Check
      : state === 'saving'
        ? Loader2
        : state === 'error' || state === 'conflict'
          ? AlertTriangle
          : CloudOff

  return (
    <div
      data-testid="save-status"
      className={cn(
        'flex flex-wrap items-center gap-2 font-mono text-[11px] text-retro-dark/60',
        className
      )}
    >
      {/* Keyed on state so each change fades in; no exit so the text is always current. */}
      <motion.span
        key={state}
        role="status"
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'inline-flex items-center gap-1.5',
          state === 'saved' && 'text-retro-mint',
          (state === 'error' || state === 'conflict') && 'text-retro-pink'
        )}
      >
        <Icon className={cn('h-3 w-3', state === 'saving' && 'animate-spin')} />
        {COPY[state]}
      </motion.span>
      {!durable && state !== 'saved' && (
        <span role="alert" className="text-retro-orange">
          Browser storage is unavailable. Keep this page open until saved.
        </span>
      )}
      {state === 'error' && (
        <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={retry}>
          <RefreshCw className="mr-1 h-3 w-3" />
          Retry save
        </Button>
      )}
      {state === 'conflict' && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[11px]"
            disabled={resolving}
            onClick={() => void decide(true)}
          >
            Keep my draft
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[11px]"
            disabled={resolving}
            onClick={() => void decide(false)}
          >
            Use current version
          </Button>
        </>
      )}
      {failed && <span role="alert">Could not load the current version. Try again.</span>}
    </div>
  )
}
