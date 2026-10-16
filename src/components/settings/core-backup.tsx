'use client'
import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'
import type { ImportPreview, ImportResult } from '@/lib/data/backup'
import { BACKUP_MAX_BYTES, parseBackup, type CoreBackup } from '@/lib/validations/backup'
import { Button } from '@/components/ui/button'
const labels = {
  captures: 'Captures',
  projects: 'Projects',
  tasks: 'Tasks and routines',
  goals: 'Growth goals',
  notes: 'Notes',
  dayPlans: 'Day plans',
  dailyReviews: 'Daily reflections',
  weeklyReviews: 'Weekly reflections',
  focusSessions: 'Focus sessions',
  growthEvidence: 'Growth evidence',
  taskPlanEvents: 'Planning history',
  taskLinks: 'Task links',
  projectNotes: 'Project notes',
  noteLinks: 'Note links',
}
function errorMessage(error: unknown) {
  const value = error as { error?: { message?: string } }
  return (
    value?.error?.message ??
    'Could not process the backup. Check that it is a NoBrainy core backup under 10 MB, then retry.'
  )
}
export function CoreBackupSection() {
  const [backup, setBackup] = useState<CoreBackup | null>(null),
    [preview, setPreview] = useState<ImportPreview | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [result, setResult] = useState('')
  const requestId = useRef(''),
    cache = useQueryClient()
  const runPreview = async (value: CoreBackup) => {
    setBusy(true)
    setError('')
    setResult('')
    setPreview(null)
    try {
      setPreview(
        (
          await apiClient<ApiResponse<ImportPreview>>('/api/data/preview', {
            method: 'POST',
            body: JSON.stringify(value),
          })
        ).data
      )
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="surface space-y-5 p-5 sm:p-6" aria-labelledby="core-backup-title">
      <div>
        <h2 id="core-backup-title" className="text-lg font-semibold">
          Keep a copy of your progress
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Core JSON backup includes captures, projects, tasks and routines, daily plans, growth
          goals and evidence, Focus history, notes and reflections with their internal links.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          It excludes passwords, API keys, account settings, public sharing, books, flashcards,
          bookmarks, watchlist, finance, Stash and cloud files. Links to excluded records are
          omitted. This is not a full database recovery archive. Keep the downloaded file somewhere
          private.
        </p>
      </div>
      <Button
        variant="outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setError('')
          try {
            const response = await fetch('/api/data/export')
            if (!response.ok) throw await response.json()
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `nobrainy-core-${new Date().toISOString().slice(0, 10)}.json`
            link.click()
            setTimeout(() => URL.revokeObjectURL(url), 10000)
          } catch (e) {
            setError(errorMessage(e))
          } finally {
            setBusy(false)
          }
        }}
      >
        Download core backup
      </Button>
      <div className="border-t pt-5">
        <label htmlFor="core-backup-file" className="block text-sm font-medium">
          Choose core backup
        </label>
        <input
          id="core-backup-file"
          type="file"
          accept="application/json,.json"
          disabled={busy}
          className="mt-2 max-w-full text-sm"
          onChange={async (event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            setPreview(null)
            setBackup(null)
            setResult('')
            setError('')
            if (!file) return
            try {
              if (file.size > BACKUP_MAX_BYTES) throw Error('Too large')
              const parsed = parseBackup(await file.text())
              setBackup(parsed)
              requestId.current = crypto.randomUUID()
              await runPreview(parsed)
            } catch (e) {
              setError(errorMessage(e))
            }
          }}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Maximum 10 MB / 20,000 records. Preview does not change your workspace. Import adds copies
          and never replaces existing records.
        </p>
      </div>
      {busy && (
        <p role="status" className="text-sm">
          Working on your backup…
        </p>
      )}
      {preview && (
        <div className="space-y-4 rounded-xl bg-muted/40 p-4" data-testid="backup-preview">
          <h3 className="font-medium">Import preview</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {Object.entries(preview.imported).map(([key, count]) => (
              <div key={key} className="flex justify-between gap-2">
                <dt>{labels[key as keyof typeof labels]}</dt>
                <dd>{count}</dd>
              </div>
            ))}
          </dl>
          {Object.entries(preview.skipped).some(([, dates]) => dates.length > 0) && (
            <div className="text-sm">
              <p className="font-medium">
                Existing dates will be kept; these backup entries will be skipped:
              </p>
              {Object.entries(preview.skipped)
                .filter(([, dates]) => dates.length)
                .map(([key, dates]) => (
                  <p key={key} className="mt-1 break-words">
                    {labels[key as keyof typeof labels]}: {dates.join(', ')}
                  </p>
                ))}
              <p className="mt-2">The skipped entries remain in your backup file.</p>
            </div>
          )}
          <p className="text-sm">
            {preview.omittedLinks} links to excluded or unavailable records were omitted.{' '}
            {preview.activeSnapshots} unfinished Focus sessions will become progress snapshots; no
            timer starts and no task is completed. Imported notes are private.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy}
              onClick={async () => {
                if (!backup || busy) return
                setBusy(true)
                setError('')
                try {
                  const response = await apiClient<ApiResponse<ImportResult>>('/api/data/import', {
                    method: 'POST',
                    body: JSON.stringify({
                      backup,
                      clientRequestId: requestId.current,
                      fingerprint: preview.fingerprint,
                      confirm: true,
                    }),
                  })
                  setResult(
                    response.data.alreadyImported
                      ? 'This backup was already imported. No duplicate records were added.'
                      : 'Core records imported. Existing records were kept.'
                  )
                  setPreview(null)
                  setBackup(null)
                  await cache.invalidateQueries()
                } catch (e) {
                  setError(errorMessage(e))
                } finally {
                  setBusy(false)
                }
              }}
            >
              Confirm additive import
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setPreview(null)
                setBackup(null)
                setError('')
              }}
            >
              Cancel import
            </Button>
          </div>
        </div>
      )}
      {error && (
        <div role="alert" className="space-y-2 text-sm text-destructive">
          <p>{error}</p>
          {backup && (
            <Button variant="outline" disabled={busy} onClick={() => void runPreview(backup)}>
              Refresh preview
            </Button>
          )}
        </div>
      )}
      {result && (
        <p role="status" className="text-sm text-primary">
          {result}
        </p>
      )}
    </section>
  )
}
