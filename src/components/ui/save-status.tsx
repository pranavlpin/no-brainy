'use client'

import { useState } from 'react'
import type { SaveState } from '@/lib/tasks/draft-save'
import { Button } from '@/components/ui/button'

/** Accessible save feedback with explicit recovery choices; never claims a failed save succeeded. */
export function SaveStatus({
  state,
  durable,
  retry,
  resolve,
}: {
  state: SaveState
  durable: boolean
  retry: () => void
  resolve: (keep: boolean) => Promise<void>
}) {
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
  return (
    <div
      className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
      data-testid="save-status"
    >
      <span role="status">
        {
          {
            saved: 'Saved',
            pending: 'Unsaved changes',
            saving: 'Saving…',
            error: 'Could not save. Your draft is retained.',
            conflict: 'Changed elsewhere. Your draft is retained; choose which version to keep.',
          }[state]
        }
      </span>
      {!durable && state !== 'saved' && (
        <span role="alert">Browser storage is unavailable. Keep this page open until saved.</span>
      )}
      {state === 'error' && (
        <Button size="sm" variant="outline" onClick={retry}>
          Retry save
        </Button>
      )}
      {state === 'conflict' && (
        <>
          <Button
            size="sm"
            variant="outline"
            disabled={resolving}
            onClick={() => void decide(true)}
          >
            Keep my draft
          </Button>
          <Button size="sm" variant="ghost" disabled={resolving} onClick={() => void decide(false)}>
            Use current version
          </Button>
        </>
      )}
      {failed && <span role="alert">Could not load the current version. Try again.</span>}
    </div>
  )
}
