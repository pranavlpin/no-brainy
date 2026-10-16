'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[dashboard] route error', error)
  }, [error])

  return (
    <div className="mx-auto max-w-lg pt-16" data-testid="route-error">
      <Card className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-retro-pink/10">
          <AlertTriangle className="h-6 w-6 text-retro-pink" />
        </div>
        <h2 className="mt-4 font-display text-lg font-bold text-retro-dark">
          Something broke here
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The rest of the app is fine. Try again, or head back to Today.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            Go to Today
          </Button>
        </div>
      </Card>
    </div>
  )
}
