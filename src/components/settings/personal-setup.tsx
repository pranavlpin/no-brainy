'use client'
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePersonalSettings } from '@/hooks/use-personal-settings'
import { useAuth } from '@/hooks/use-auth'
import { useFocus } from '@/hooks/use-focus'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'
import type { PersonalSettings } from '@/lib/data/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingState, ErrorState } from '@/components/ui/workspace-states'
import Link from 'next/link'

/** Apply the saved account motion preference, restoring the browser default when the owner leaves. */
export function PersonalPreferences() {
  const { data } = usePersonalSettings()
  useEffect(() => {
    document.documentElement.dataset.motion = data?.reduceMotion ? 'reduced' : 'system'
    return () => {
      delete document.documentElement.dataset.motion
    }
  }, [data?.reduceMotion])
  return null
}
/** Offer optional first-use setup without seeding records or blocking the daily flow. */
export function SetupNudge() {
  const { data } = usePersonalSettings()
  return data && !data.setupComplete ? (
    <aside className="surface-soft mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
      <p className="text-sm text-muted-foreground">
        Start with a day that fits you. Set your timezone and comfortable capacity.
      </p>
      <Link
        href="/settings#personal-setup"
        className="text-sm font-medium text-primary underline underline-offset-4"
      >
        Set up my workspace
      </Link>
    </aside>
  ) : null
}
function SetupForm({ initial }: { initial: PersonalSettings }) {
  const [values, setValues] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [saved, setSaved] = useState(false)
  const cache = useQueryClient(),
    { user } = useAuth(),
    focus = useFocus()
  const change = <K extends keyof PersonalSettings>(key: K, value: PersonalSettings[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    setSaved(false)
  }
  return (
    <form
      className="surface space-y-5 p-5 sm:p-6"
      onSubmit={async (event) => {
        event.preventDefault()
        if (busy) return
        setBusy(true)
        setError('')
        setSaved(false)
        try {
          const { setupComplete: _complete, ...body } = values
          const response = await apiClient<ApiResponse<PersonalSettings>>(
            '/api/settings/personal',
            { method: 'PATCH', body: JSON.stringify(body) }
          )
          cache.setQueryData(['personal-settings', user?.id], response.data)
          focus.setSetup({ sound: response.data.sound })
          setValues(response.data)
          setSaved(true)
          await cache.invalidateQueries({ queryKey: ['planner'] })
        } catch {
          setError(
            'Could not save personal setup. Check your timezone and working window, then retry.'
          )
        } finally {
          setBusy(false)
        }
      }}
    >
      <div>
        <h2 className="text-lg font-semibold">Make room for your day</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose defaults that fit your life. Capacity is a planning guide; you can change it for
          any day.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          Timezone
          <Input
            aria-label="Timezone"
            list="personal-timezones"
            value={values.timezone}
            onChange={(e) => change('timezone', e.target.value)}
            required
          />
        </label>
        <datalist id="personal-timezones">
          {[
            'Asia/Kolkata',
            'UTC',
            'Europe/London',
            'America/New_York',
            'America/Los_Angeles',
            'Asia/Singapore',
          ].map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
        <label className="space-y-1 text-sm">
          Default task context
          <select
            aria-label="Default task context"
            className="w-full rounded-xl border bg-background p-2.5"
            value={values.defaultContext}
            onChange={(e) => change('defaultContext', e.target.value as 'work' | 'personal')}
          >
            <option value="personal">Personal</option>
            <option value="work">Work</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          Daily capacity (minutes)
          <Input
            aria-label="Daily capacity (minutes)"
            type="number"
            min="0"
            max="1440"
            value={values.availableMinutes}
            onChange={(e) => change('availableMinutes', Number(e.target.value))}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 text-sm">
            Work starts
            <Input
              aria-label="Work starts"
              type="time"
              value={values.workStart ?? ''}
              onChange={(e) => change('workStart', e.target.value || null)}
            />
          </label>
          <label className="space-y-1 text-sm">
            Work ends
            <Input
              aria-label="Work ends"
              type="time"
              value={values.workEnd ?? ''}
              onChange={(e) => change('workEnd', e.target.value || null)}
            />
          </label>
        </div>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={values.reduceMotion}
          onChange={(e) => change('reduceMotion', e.target.checked)}
        />
        Reduce animation
      </label>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={values.sound}
          onChange={(e) => change('sound', e.target.checked)}
        />
        Gentle Focus sound by default
      </label>
      <p className="text-xs text-muted-foreground">
        Your device’s reduced-motion preference is always respected. Sound stays optional in each
        Focus session. New daily plans use these defaults; existing plans stay as you set them.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-primary">
          Personal setup saved.
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? 'Saving…' : 'Save personal setup'}
      </Button>
    </form>
  )
}
export function PersonalSetup() {
  const query = usePersonalSettings()
  if (query.isLoading) return <LoadingState label="Loading personal setup…" />
  if (query.isError) return <ErrorState retry={() => void query.refetch()} />
  return query.data ? <SetupForm initial={query.data} /> : null
}
