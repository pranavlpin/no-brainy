'use client'
import { useFocus } from '@/hooks/use-focus'
import { useUIStore } from '@/stores/ui-store'
import { timerLabel } from '@/lib/focus/clock'
import { Button } from '@/components/ui/button'

/** Persistent timer affordance while the user works elsewhere in the workspace. */
export function CompactFocusTimer() {
  const focus = useFocus()
  const { focusMode, enterFocusMode } = useUIStore()
  if (focusMode || (!focus.active && !focus.pending)) return null
  return (
    <aside
      data-testid="compact-focus-timer"
      aria-label="Current focus session"
      className="fixed bottom-20 right-4 z-40 max-w-[calc(100vw-2rem)] rounded-2xl border bg-card p-3 shadow-soft-lg lg:bottom-5"
    >
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
        <div className="min-w-0">
          <p className="max-w-52 truncate text-xs font-medium">
            {focus.active?.taskTitle ?? 'Session waiting to save'}
          </p>
          <p className="text-sm tabular-nums">
            {timerLabel(focus.remaining)}{' '}
            <span className="text-xs text-muted-foreground">
              {focus.pending
                ? 'Not yet saved'
                : focus.active?.state === 'paused'
                  ? 'Paused'
                  : focus.remaining === 0
                    ? 'Time complete'
                    : 'Focusing'}
            </span>
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          aria-label="Open focus session"
          onClick={() => enterFocusMode(focus.active?.taskId ?? focus.setup.taskId ?? '')}
        >
          Open
        </Button>
      </div>
    </aside>
  )
}
