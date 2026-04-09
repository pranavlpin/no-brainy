'use client'

import { Sparkles, Settings } from 'lucide-react'
import Link from 'next/link'
import { useAI } from '@/hooks/use-ai'
import { Button } from '@/components/ui/button'
import { CoachChat } from '@/components/ai/coach-chat'

export default function AICoachPage() {
  const { isEnabled, isLoading } = useAI()

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    )
  }

  if (!isEnabled) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
          <Sparkles className="h-8 w-8 text-purple-500" />
        </div>
        <h1 className="font-display text-2xl font-bold text-retro-dark">AI Coach</h1>
        <p className="max-w-md text-muted-foreground">
          Configure your OpenAI API key in Settings to start chatting with your
          AI coach.
        </p>
        <Link href="/settings">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Go to Settings
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <CoachChat />
    </div>
  )
}
