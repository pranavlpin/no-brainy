'use client'

import { useEffect, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { usePersonalSettings, useSavePersonalSettings } from '@/hooks/use-personal-settings'
import { PERSONAL_DEFAULTS, type PersonalSettingsInput } from '@/lib/settings/personal'

/** Defaults a new day starts from. Any day can still be adjusted on the planner. */
export function PersonalSetup() {
  const { data, isLoading } = usePersonalSettings()
  const save = useSavePersonalSettings()
  const [values, setValues] = useState<PersonalSettingsInput>(PERSONAL_DEFAULTS)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (data) {
      const { timezone: _tz, setupComplete: _done, ...rest } = data
      setValues(rest)
    }
  }, [data])

  const change = <K extends keyof PersonalSettingsInput>(
    key: K,
    value: PersonalSettingsInput[K]
  ) => {
    setValues((v) => ({ ...v, [key]: value }))
    setSaved(false)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSaved(false)
    try {
      await save.mutateAsync(values)
      setSaved(true)
    } catch (e) {
      setError(
        (e as { error?: { message?: string } })?.error?.message ??
          'Could not save. Your choices are kept; retry.'
      )
    }
  }

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="rounded-lg border border-retro-dark/15 bg-card p-6"
      data-testid="personal-setup"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-retro-blue/10">
          <SlidersHorizontal className="h-5 w-5 text-retro-blue" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-retro-dark">A day that fits you</h3>
            <p className="mt-1 text-sm text-retro-dark/60">
              New day plans start from these. Capacity is a guide, not a quota; change it on any day
              from the planner.
            </p>
          </div>
          {isLoading ? (
            <p className="font-mono text-xs text-retro-dark/50">Loading…</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="personal-capacity">Available minutes a day</Label>
                  <Input
                    id="personal-capacity"
                    type="number"
                    min={0}
                    max={1440}
                    inputMode="numeric"
                    value={values.availableMinutes}
                    onChange={(e) => change('availableMinutes', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="personal-buffer">Buffer minutes</Label>
                  <Input
                    id="personal-buffer"
                    type="number"
                    min={0}
                    max={1440}
                    inputMode="numeric"
                    value={values.bufferMinutes}
                    onChange={(e) => change('bufferMinutes', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="personal-work-start">Work starts</Label>
                  <Input
                    id="personal-work-start"
                    type="time"
                    value={values.workStart ?? ''}
                    onChange={(e) => change('workStart', e.target.value || null)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="personal-work-end">Work ends</Label>
                  <Input
                    id="personal-work-end"
                    type="time"
                    value={values.workEnd ?? ''}
                    onChange={(e) => change('workEnd', e.target.value || null)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="personal-context">Default context</Label>
                  <Select
                    id="personal-context"
                    value={values.defaultContext}
                    onChange={(e) =>
                      change('defaultContext', e.target.value as 'work' | 'personal')
                    }
                  >
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                  </Select>
                </div>
                <label className="flex items-center gap-3 self-end pb-2 text-sm text-retro-dark">
                  <input
                    type="checkbox"
                    checked={values.sound}
                    onChange={(e) => change('sound', e.target.checked)}
                    className="h-4 w-4 accent-retro-blue"
                  />
                  Chime when a focus block ends
                </label>
              </div>
              <p className="text-xs text-retro-dark/50">
                Your timezone is detected from the browser and shown under Time. Your device&apos;s
                reduced-motion setting is always respected.
              </p>
              {error && (
                <p role="alert" className="text-sm text-retro-pink">
                  {error}
                </p>
              )}
              <div className="flex items-center gap-3">
                <Button type="submit" size="sm" disabled={save.isPending}>
                  {save.isPending ? 'Saving…' : 'Save personal setup'}
                </Button>
                {saved && (
                  <span role="status" className="font-mono text-xs text-retro-mint">
                    Saved
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </form>
  )
}
