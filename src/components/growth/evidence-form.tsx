'use client'
import { useRef, useState } from 'react'
import { useSaveEvidence } from '@/hooks/use-growth'
import type { EvidenceResponse, EvidenceKind, GrowthSourceType } from '@/lib/types/growth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { GrowthSourcePicker } from './source-picker'
/** Keep reflection input until a versioned evidence save is confirmed. Sources are immutable after creation. */
export function EvidenceForm({
  goalId,
  today,
  initial,
  initialKind = 'reflection',
  onSaved,
}: {
  goalId: string
  today: string
  initial?: EvidenceResponse
  initialKind?: EvidenceKind
  onSaved: () => void
}) {
  const save = useSaveEvidence()
  const lock = useRef(false)
  const [requestId] = useState(() => crypto.randomUUID())
  const [date, setDate] = useState(initial?.observedAt ?? today)
  const [summary, setSummary] = useState(
    initial?.summary ??
      (initialKind === 'rest'
        ? 'A deliberate rest day.'
        : initialKind === 'skip'
          ? 'Skipped this practice deliberately.'
          : '')
  )
  const [measurement, setMeasurement] = useState(
    initial?.measurement == null ? '' : String(initial.measurement)
  )
  const [kind, setKind] = useState<EvidenceKind>(initial?.kind ?? initialKind)
  const [type, setType] = useState<GrowthSourceType | null>(initial?.sourceType ?? null)
  const [source, setSource] = useState<{ id: string; title: string } | null>(
    initial?.sourceId
      ? { id: initial.sourceId, title: initial.sourceTitle ?? 'Original source' }
      : null
  )
  const [error, setError] = useState('')
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault()
        if (lock.current) return
        lock.current = true
        setError('')
        try {
          const data = {
            observedAt: date,
            summary,
            measurement: measurement === '' ? null : Number(measurement),
            kind,
          }
          await save.mutateAsync(
            initial
              ? { id: initial.id, data: { ...data, expectedUpdatedAt: initial.updatedAt } }
              : {
                  ...data,
                  clientRequestId: requestId,
                  goalId,
                  sourceType: type,
                  sourceId: source?.id ?? null,
                }
          )
          onSaved()
        } catch (e) {
          setError(
            (e as { error?: { message?: string } })?.error?.message ??
              'Could not save evidence. Your observation is kept; please retry.'
          )
        } finally {
          lock.current = false
        }
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="evidence-date" className="mb-1 block text-sm">
            Observation date
          </label>
          <Input
            id="evidence-date"
            type="date"
            required
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="evidence-kind" className="mb-1 block text-sm">
            Record as
          </label>
          <Select
            id="evidence-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as EvidenceKind)}
          >
            <option value="reflection">Reflection</option>
            <option value="practice">Practice</option>
            <option value="rest">Rest</option>
            <option value="skip">Deliberate skip</option>
          </Select>
        </div>
      </div>
      <div>
        <label htmlFor="evidence-summary" className="mb-1 block text-sm">
          What did you observe?
        </label>
        <textarea
          id="evidence-summary"
          autoFocus
          required
          maxLength={10000}
          className="min-h-28 w-full rounded-xl border bg-background p-3 text-sm"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="A concrete example, a result, or something you learned."
        />
      </div>
      <div>
        <label htmlFor="evidence-measurement" className="mb-1 block text-sm">
          Observed measurement
        </label>
        <Input
          id="evidence-measurement"
          type="number"
          step="any"
          placeholder="Optional"
          value={measurement}
          onChange={(e) => setMeasurement(e.target.value)}
        />
      </div>
      {!initial && (
        <>
          <div>
            <label htmlFor="evidence-source-type" className="mb-1 block text-sm">
              Evidence source (optional)
            </label>
            <Select
              id="evidence-source-type"
              value={type ?? ''}
              onChange={(e) => {
                setType((e.target.value || null) as GrowthSourceType | null)
                setSource(null)
              }}
            >
              <option value="">My own observation</option>
              <option value="note">Note</option>
              <option value="book">Book</option>
              <option value="project">Project</option>
              <option value="session">Focus session</option>
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
            <div className="flex items-center justify-between rounded-xl bg-muted p-3 text-sm">
              <span>{source.title}</span>
              <Button type="button" size="sm" variant="ghost" onClick={() => setSource(null)}>
                Change source
              </Button>
            </div>
          )}
        </>
      )}
      {initial?.sourceTitle && (
        <p className="text-xs text-muted-foreground">
          Source: {initial.sourceTitle}. Correcting this observation leaves the original source
          unchanged.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        type="submit"
        className="w-full"
        disabled={save.isPending || !summary.trim() || (!!type && !source)}
      >
        {save.isPending ? 'Saving…' : initial ? 'Save correction' : 'Save evidence'}
      </Button>
    </form>
  )
}
