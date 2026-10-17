'use client'

import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Download, HardDriveUpload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api-client'
import { BACKUP_MAX_BYTES, parseBackup, type CoreBackup } from '@/lib/validations/backup'
import type { ImportPreview, ImportResult } from '@/lib/data/backup'
import type { ApiResponse } from '@/lib/types/api'

const LABELS: Record<string, string> = {
  captures: 'Inbox captures',
  goals: 'Goals',
  projects: 'Projects',
  notes: 'Notes',
  tasks: 'Tasks',
  taskLinks: 'Task links',
  projectNotes: 'Project notes',
  noteLinks: 'Note links',
  dayPlans: 'Day plans',
  dailyReviews: 'Daily reviews',
  weeklyReviews: 'Weekly adjustments',
  focusSessions: 'Focus sessions',
  growthEvidence: 'Growth evidence',
}

function messageOf(error: unknown): string {
  const value = error as { error?: { message?: string }; message?: string }
  return (
    value?.error?.message ??
    value?.message ??
    'Could not process the backup. Check that it is a NoBrainy core backup under 10 MB.'
  )
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}`
}

/** Export the core workspace, or preview and additively import a backup file. */
export function CoreBackupSection() {
  const [backup, setBackup] = useState<CoreBackup | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const requestId = useRef('')
  const client = useQueryClient()

  const runPreview = async (value: CoreBackup) => {
    setBusy(true)
    setError('')
    setResult('')
    setPreview(null)
    try {
      const res = await apiClient<ApiResponse<ImportPreview>>('/api/data/preview', {
        method: 'POST',
        body: JSON.stringify(value),
      })
      setPreview(res.data)
    } catch (e) {
      setError(messageOf(e))
    } finally {
      setBusy(false)
    }
  }

  const download = async () => {
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
      setError(messageOf(e))
    } finally {
      setBusy(false)
    }
  }

  const confirm = async () => {
    if (!backup || !preview || busy) return
    setBusy(true)
    setError('')
    try {
      const res = await apiClient<ApiResponse<ImportResult>>('/api/data/import', {
        method: 'POST',
        body: JSON.stringify({
          backup,
          clientRequestId: requestId.current,
          fingerprint: preview.fingerprint,
          confirm: true,
        }),
      })
      setResult(
        res.data.alreadyImported
          ? 'This backup was already imported. Nothing was added twice.'
          : 'Imported. Existing records were kept; copies were added with new ids.'
      )
      setPreview(null)
      setBackup(null)
      await client.invalidateQueries()
    } catch (e) {
      setError(messageOf(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border border-retro-dark/15 bg-card p-6" data-testid="core-backup">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-retro-blue/10">
          <HardDriveUpload className="h-5 w-5 text-retro-blue" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-retro-dark">Keep a copy of your progress</h3>
            <p className="mt-1 text-sm text-retro-dark/60">
              A JSON file with your inbox, tasks, projects, goals and evidence, plans, reviews,
              focus history, notes, and their links. It leaves out passwords, API keys, account
              settings, public shares, books, flashcards, bookmarks, money, and Stash. Keep it
              somewhere private.
            </p>
          </div>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => void download()}>
            <Download className="mr-1.5 h-4 w-4" />
            Download core backup
          </Button>

          <div className="border-t border-retro-dark/10 pt-4">
            <label htmlFor="core-backup-file" className="block text-sm font-medium text-retro-dark">
              Restore from a backup
            </label>
            <input
              id="core-backup-file"
              type="file"
              accept="application/json,.json"
              disabled={busy}
              className="mt-2 block max-w-full text-sm"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                setPreview(null)
                setBackup(null)
                setResult('')
                setError('')
                if (!file) return
                try {
                  if (file.size > BACKUP_MAX_BYTES)
                    throw new Error('Backup is too large. Maximum 10 MB.')
                  const parsed = parseBackup(await file.text())
                  setBackup(parsed)
                  requestId.current = newId()
                  await runPreview(parsed)
                } catch (e) {
                  setError(messageOf(e))
                }
              }}
            />
            <p className="mt-2 text-xs text-retro-dark/50">
              Up to 10 MB and 20,000 records. Preview changes nothing. Import only adds; it never
              replaces or deletes what you have.
            </p>
          </div>

          {busy && (
            <p role="status" className="font-mono text-xs text-retro-dark/60">
              Working on your backup…
            </p>
          )}

          {preview && (
            <div
              className="space-y-3 rounded-xl bg-retro-yellow/15 p-4"
              data-testid="backup-preview"
            >
              <p className="font-medium text-retro-dark">What this import adds</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {Object.entries(preview.imported).map(([key, count]) => (
                  <div key={key} className="flex justify-between gap-2">
                    <dt className="text-retro-dark/70">{LABELS[key] ?? key}</dt>
                    <dd className="font-mono">{count}</dd>
                  </div>
                ))}
              </dl>
              {Object.values(preview.skipped).some((d) => d.length > 0) && (
                <p className="text-xs text-retro-dark/70">
                  Days you already have are kept; these backup entries are skipped:{' '}
                  {Object.entries(preview.skipped)
                    .filter(([, d]) => d.length)
                    .map(([k, d]) => `${LABELS[k] ?? k} (${d.join(', ')})`)
                    .join('; ')}
                  .
                </p>
              )}
              <p className="text-xs text-retro-dark/70">
                {preview.omittedLinks} link{preview.omittedLinks === 1 ? '' : 's'} to things outside
                the backup were left out. {preview.openSessions} unfinished focus session
                {preview.openSessions === 1 ? '' : 's'} will be closed at export time. Imported
                notes are private.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => void confirm()}
                  data-testid="backup-confirm"
                >
                  Confirm additive import
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    setPreview(null)
                    setBackup(null)
                    setError('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="space-y-2 text-sm text-retro-pink">
              <p>{error}</p>
              {backup && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void runPreview(backup)}
                >
                  Refresh preview
                </Button>
              )}
            </div>
          )}
          {result && (
            <p role="status" className="text-sm text-retro-dark">
              {result}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
