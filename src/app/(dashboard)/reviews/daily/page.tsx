'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatsGrid } from '@/components/reviews/stats-grid'
import { MoodSelector } from '@/components/reviews/mood-selector'
import { MarkdownEditor } from '@/components/editor/markdown-editor'
import { useDailyReview, useCreateReview, useUpdateReview } from '@/hooks/use-reviews'

export default function DailyReviewPage() {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const { data: existingReview, isLoading, isError } = useDailyReview(today)
  const createReview = useCreateReview()
  const updateReview = useUpdateReview(today)

  const [reflection, setReflection] = useState('')
  const [mood, setMood] = useState<string | null>(null)
  const [hasCreated, setHasCreated] = useState(false)
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    tasksMissed: 0,
    notesCreated: 0,
    cardsReviewed: 0,
  })

  // Populate form from existing review
  useEffect(() => {
    if (existingReview) {
      setReflection(existingReview.reflectionMd)
      setMood(existingReview.mood)
      setStats({
        tasksCompleted: existingReview.tasksCompleted,
        tasksMissed: existingReview.tasksMissed,
        notesCreated: existingReview.notesCreated,
        cardsReviewed: existingReview.cardsReviewed,
      })
      setHasCreated(true)
    }
  }, [existingReview])

  // Auto-create review if none exists (to fetch stats)
  useEffect(() => {
    if (!isLoading && isError && !hasCreated && !createReview.isPending) {
      createReview.mutate(
        { reviewDate: today },
        {
          onSuccess: (data) => {
            setStats({
              tasksCompleted: data.tasksCompleted,
              tasksMissed: data.tasksMissed,
              notesCreated: data.notesCreated,
              cardsReviewed: data.cardsReviewed,
            })
            setHasCreated(true)
          },
        }
      )
    }
  }, [isLoading, isError, hasCreated, today, createReview])

  const handleSave = () => {
    updateReview.mutate(
      {
        reflectionMd: reflection,
        mood,
      },
      {
        onSuccess: () => {
          router.push('/reviews')
        },
      }
    )
  }

  const isSaving = updateReview.isPending
  const isReady = hasCreated || !!existingReview

  if (isLoading || createReview.isPending) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Preparing your review...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/reviews')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Daily Review</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(today + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {isReady && (
        <>
          {/* Step 1: Stats */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Today&apos;s Stats
            </h2>
            <StatsGrid {...stats} />
          </section>

          {/* Step 2: Reflection */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Reflection
            </h2>
            <p className="text-sm text-muted-foreground">
              What did you accomplish today? What went well? What could be
              improved?
            </p>
            <MarkdownEditor
              value={reflection}
              onChange={setReflection}
              placeholder="Write your reflection here..."
              minHeight="200px"
            />
          </section>

          {/* Step 3: Mood */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              How are you feeling?
            </h2>
            <MoodSelector value={mood} onChange={setMood} />
          </section>

          {/* Save */}
          <div className="flex justify-end pb-8">
            <Button onClick={handleSave} disabled={isSaving} size="lg">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Review
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
