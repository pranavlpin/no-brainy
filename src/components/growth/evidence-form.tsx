'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { GrowthSourcePicker } from '@/components/growth/source-picker'
import { useSaveEvidence } from '@/hooks/use-growth'
import type { EvidenceKind, EvidenceResponse, GrowthSourceType } from '@/lib/types/growth'

interface EvidenceFormProps {
  goalId: string
  /** Today's date key in the user's zone; observations cannot be in the future. */
  today: string
  initial?: EvidenceResponse
  initialKind?: EvidenceKind
  unit?: string | null
  onSaved: (saved: EvidenceResponse) => void
}

const KIND_COPY: Record<EvidenceKind, string> = {
  reflection: 'Reflection',
  practice: 'Practice',
  rest: 'Rest',
  skip: 'Deliberate skip',
}

const DEFAULT_SUMMARY: Partial<Record<EvidenceKind, string>> = {
  rest: 'A deliberate rest day.',
  skip: 'Skipped this practice on purpose.',
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
      })
}

/**
 * One dated observation. The text stays if saving fails; the request id makes
 * a retry safe. A correction is versioned and never changes the source.
 */
export function EvidenceForm({ goalId, today, initial, initialKind = 'reflection', unit, onSaved }: EvidenceFormProps) {
  const save = useSaveEvidence()
  const lock = useRef(false)
  const [requestId] = useState(newId)
  const [date, setDate] = useState(initial?.observedAt ?? today)
  const [kind, setKind] = useState<EvidenceKind>(initial?.kind ?? initialKind)
  const [summary, setSummary] = useState(initial?.summary ?? DEFAULT_SUMMARY[initialKind] ?? '')
  const [measurement, setMeasurement] = useState(initial?.measurement == null ? '' : String(initial.measurement))
  const [type, setType] = useState<GrowthSourceType | null>(initial?.sourceType ?? null)
  const [source, setSource] = useState<{ id: string; title: string } | null>(
    initial?.sourceId ? { id: initial.sourceId, title: initial.sourceTitle ?? 'Source' } : null
  )
  const [error, setError] = useState('')

  const canSave = summary.trim().length > 0 && (!type || !!source) && !save.isPending

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (lock.current || !canSave) return
    lock.current = true
    setError('')
    try {
      const data = {
        observedAt: date,
        summary: summary.trim(),
        measurement: measurement === '' ? null : Number(measurement),
        kind,
      }
      const saved = await save.mutateAsync(
        initial
          ? { id: initial.id, data: { ...data, expectedUpdatedAt: initial.updatedAt } }
          : { ...data, clientRequestId: requestId, goalId, sourceType: type, sourceId: source?.id ?? null }
      )
      onSaved(saved)
    } catch (e) {
      setError(
        (e as { error?: { message?: string } })?.error?.message ??
          'Could not save. Your observation is kept; try again.'
      )
    } finally {
      lock.current = false
    }
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void submit(e)} data-testid="evidence-form">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="evidence-date">Date</Label>
          <Input id="evidence-date" type="date" required max={today} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="evidence-kind">Record as</Label>
          <Select id="evidence-kind" value={kind} onChange={(e) => setKind(e.target.value as EvidenceKind)}>
            {(Object.keys(KIND_COPY) as EvidenceKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_COPY[k]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="evidence-summary">What did you observe?</Label>
        <textarea
          id="evidence-summary"
          autoFocus
          required
          maxLength={10000}
          rows={3}
          className="w-full resize-y rounded-xl border border-border/80 bg-background/70 px-3 py-2 text-sm text-retro-dark placeholder:text-retro-dark/30 focus:border-retro-blue focus:outline-none focus:ring-2 focus:ring-retro-blue/30"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="A concrete example, a result, or something you learned."
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="evidence-measurement">Measurement{unit ? ` (${unit})` : ''} (optional)</Label>
        <Input
          id="evidence-measurement"
          type="number"
          step="any"
          inputMode="decimal"
          value={measurement}
          onChange={(e) => setMeasurement(e.target.value)}
          placeholder="e.g. 180"
        />
      </div>

      {!initial && (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="evidence-source-type">Source (optional)</Label>
            <Select
              id="evidence-source-type"
              value={type ?? ''}
              onChange={(e) => {
                setType((e.target.value || null) as GrowthSourceType | null)
                setSource(null)
              }}
            >
              <option value="">My own observation</option>
              <option value="session">Focus session</option>
              <option value="note">Note</option>
              <option value="book">Book</option>
              <option value="project">Project</option>
            </Select>
          </div>
          {type && !source && (
            <GrowthSourcePicker
              key={type}
              type={type}
              onChoose={(item) => {
                setSource(item)
                if (item.observedAt) setDate(item.observedAt)
              }}
            />
          )}
          {source && (
            <div className="flex items-center justify-between rounded-xl bg-retro-yellow/20 px-3 py-2 text-sm">
              <span className="truncate text-retro-dark">{source.title}</span>
              <Button type="button" size="sm" variant="ghost" onClick={() => setSource(null)}>
                Change
              </Button>
            </div>
          )}
        </div>
      )}
      {initial?.sourceTitle && (
        <p className="text-xs text-muted-foreground">
          Source: {initial.sourceTitle}. Correcting the observation leaves the source unchanged.
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-retro-pink">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={!canSave}>
        {save.isPending ? 'Saving…' : initial ? 'Save correction' : 'Save evidence'}
      </Button>
    </form>
  )
}
