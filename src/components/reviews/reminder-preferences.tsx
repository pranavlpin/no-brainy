'use client'
import { useState } from 'react'
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { LoadingState, ErrorState } from '@/components/ui/workspace-states'
import type { NotificationPreferences } from '@/lib/reviews/reminders'
const toggles = [
  ['enabled', 'Enable in-app reminders'],
  ['quietHoursEnabled', 'Respect quiet hours'],
  ['dueTasks', 'Due task reminders'],
  ['overdueTasks', 'Past-deadline reminders'],
  ['habitReminders', 'Routine reminders'],
  ['flashcardReminders', 'Learning reminders'],
  ['dailyReviewReminders', 'Daily reflection reminder'],
] as const
/** Optional in-app nudges with explicit quiet hours and retained edits on failure. */
export function NotificationPreferencesSection() {
  const query = useNotificationPreferences(),
    update = useUpdateNotificationPreferences(),
    [patch, setPatch] = useState<Partial<NotificationPreferences>>({})
  if (query.isLoading) return <LoadingState label="Loading reminder preferences" />
  if (query.isError || !query.data) return <ErrorState retry={() => void query.refetch()} />
  const value = { ...query.data, ...patch }
  return (
    <section className="surface space-y-5 p-6">
      <div>
        <h3 className="text-lg font-semibold">Reminders that leave you room</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Optional nudges appear while you use the app. Quiet hours use your saved timezone. Paused
          goals and routines stay quiet.
        </p>
      </div>
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault()
          try {
            await update.mutateAsync(patch)
            setPatch({})
          } catch {
            /* Retain edits for retry. */
          }
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {toggles.map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={value[key]}
                onChange={(event) => setPatch({ ...patch, [key]: event.target.checked })}
                className="h-4 w-4 accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ['quietStart', 'Quiet hours start'],
              ['quietEnd', 'Quiet hours end'],
              ['reviewTime', 'Reflection reminder time'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label htmlFor={`reminder-${key}`} className="text-xs font-medium">
                {label}
              </label>
              <input
                id={`reminder-${key}`}
                type="time"
                required
                value={value[key]}
                onChange={(event) => setPatch({ ...patch, [key]: event.target.value })}
                className="mt-2 w-full rounded-xl border bg-background p-3 text-sm"
              />
            </div>
          ))}
        </div>
        {update.isError && (
          <p role="alert" className="text-sm text-destructive">
            Could not save your choices. They are kept here; please retry.
          </p>
        )}
        {update.isSuccess && !Object.keys(patch).length && (
          <p role="status" className="text-sm text-primary">
            Reminder preferences saved.
          </p>
        )}
        <Button type="submit" disabled={update.isPending || !Object.keys(patch).length}>
          {update.isPending ? 'Saving…' : 'Save reminder preferences'}
        </Button>
      </form>
    </section>
  )
}
