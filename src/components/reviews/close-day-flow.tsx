'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Loader2, Moon, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardLabel } from '@/components/ui/card'
import { StatsGrid } from './stats-grid'
import { MoodSelector } from './mood-selector'
import {
  REFLECTION_PROMPTS,
  buildReflectionMd,
  parseReflectionMd,
  type ReflectionFields,
} from '@/lib/reviews/reflection'
import { usePrefersReducedMotion } from '@/components/motion/use-prefers-reduced-motion'
import { cn } from '@/lib/utils'

export interface CloseDayStats {
  tasksCompleted: number
  tasksMissed: number
  notesCreated: number
  cardsReviewed: number
  focusMinutes?: number | null
}

export interface CloseDayPayload {
  reflectionMd: string
  mood: string
  tomorrowIntent: string
}

interface CloseDayFlowProps {
  stats: CloseDayStats
  initial?: { reflectionMd?: string; mood?: string | null; tomorrowIntent?: string | null }
  streak?: number
  isSaving?: boolean
  onFinish: (payload: CloseDayPayload) => void
}

const STEPS = ['stats', 'reflect', 'mood', 'tomorrow'] as const
type Step = (typeof STEPS)[number]

const TITLES: Record<Step, { label: string; title: string; hint: string }> = {
  stats: { label: 'Step 1', title: 'Here is your day', hint: 'Numbers first, no judgement.' },
  reflect: { label: 'Step 2', title: 'A short reflection', hint: 'Two sentences each is plenty.' },
  mood: { label: 'Step 3', title: 'How did it feel?', hint: 'Pick the closest one.' },
  tomorrow: {
    label: 'Step 4',
    title: 'One thing for tomorrow',
    hint: 'This becomes tomorrow’s intent at the top of your plan.',
  },
}

/**
 * Guided evening close-out: stats, three reflection prompts, mood, and the
 * one intent for tomorrow. Finishing requires a mood and an intent.
 */
export function CloseDayFlow({
  stats,
  initial,
  streak,
  isSaving = false,
  onFinish,
}: CloseDayFlowProps) {
  const reduced = usePrefersReducedMotion()
  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [fields, setFields] = useState<ReflectionFields>(() =>
    parseReflectionMd(initial?.reflectionMd ?? '')
  )
  const [mood, setMood] = useState<string | null>(initial?.mood ?? null)
  const [intent, setIntent] = useState(initial?.tomorrowIntent ?? '')

  const step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1
  const canFinish = !!mood && intent.trim().length > 0

  const go = (delta: number) => {
    setDirection(delta)
    setStepIndex((i) => Math.min(STEPS.length - 1, Math.max(0, i + delta)))
  }

  const finish = () => {
    if (!canFinish || !mood) return
    onFinish({ reflectionMd: buildReflectionMd(fields), mood, tomorrowIntent: intent.trim() })
  }

  const variants = useMemo(
    () =>
      reduced
        ? { enter: { opacity: 1, x: 0 }, center: { opacity: 1, x: 0 }, exit: { opacity: 1, x: 0 } }
        : {
            enter: (d: number) => ({ opacity: 0, x: 24 * d }),
            center: { opacity: 1, x: 0 },
            exit: (d: number) => ({ opacity: 0, x: -24 * d }),
          },
    [reduced]
  )

  const meta = TITLES[step]

  return (
    <Card className="overflow-hidden" data-testid="close-day-flow">
      {/* Progress dots */}
      <div className="mb-5 flex items-center gap-2" aria-hidden>
        {STEPS.map((s, i) => (
          <motion.span
            key={s}
            layout
            className={cn(
              'h-1.5 rounded-full transition-colors',
              i <= stepIndex ? 'bg-retro-blue' : 'bg-retro-dark/10'
            )}
            animate={{ width: i === stepIndex ? 28 : 12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          />
        ))}
        <span className="ml-auto font-mono text-[11px] uppercase tracking-wider text-retro-dark/50">
          {meta.label} of {STEPS.length}
        </span>
      </div>

      <div className="relative min-h-[260px]">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.section
            key={step}
            role="group"
            aria-labelledby={`close-day-title-${step}`}
            data-testid={`close-day-step-${step}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <CardLabel>{meta.label}</CardLabel>
            <h2
              id={`close-day-title-${step}`}
              className="mt-1 font-display text-xl font-bold text-retro-dark"
            >
              {meta.title}
            </h2>
            <p className="mb-5 mt-1 text-sm text-muted-foreground">{meta.hint}</p>

            {step === 'stats' && (
              <div className="space-y-3">
                <StatsGrid {...stats} />
                {typeof stats.focusMinutes === 'number' && stats.focusMinutes > 0 && (
                  <p className="font-mono text-xs text-retro-dark/60">
                    {stats.focusMinutes} minutes of deep work logged.
                  </p>
                )}
              </div>
            )}

            {step === 'reflect' && (
              <div className="space-y-4">
                {REFLECTION_PROMPTS.map((p) => (
                  <label key={p.key} className="block">
                    <span className="mb-1 block text-sm font-medium text-retro-dark">
                      {p.prompt}
                    </span>
                    <textarea
                      data-testid={`reflect-${p.key}`}
                      value={fields[p.key]}
                      onChange={(e) => setFields((f) => ({ ...f, [p.key]: e.target.value }))}
                      placeholder={p.placeholder}
                      rows={2}
                      className="w-full resize-y rounded-xl border border-border/80 bg-background/70 px-3 py-2 text-sm text-retro-dark placeholder:text-retro-dark/30 focus:border-retro-blue focus:outline-none focus:ring-2 focus:ring-retro-blue/30"
                    />
                  </label>
                ))}
              </div>
            )}

            {step === 'mood' && (
              <div className="flex justify-center py-4">
                <MoodSelector value={mood} onChange={setMood} />
              </div>
            )}

            {step === 'tomorrow' && (
              <div className="space-y-3">
                <input
                  data-testid="tomorrow-intent-input"
                  value={intent}
                  maxLength={280}
                  onChange={(e) => setIntent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      finish()
                    }
                  }}
                  placeholder="If tomorrow only had room for one thing…"
                  className="w-full border-0 border-b-2 border-retro-pink/40 bg-transparent pb-2 font-display text-xl font-semibold text-retro-dark placeholder:text-retro-dark/30 focus:border-retro-pink focus:outline-none"
                />
                <p className="font-mono text-[11px] text-retro-dark/40">
                  {intent.trim().length}/280 · shows up as tomorrow&apos;s intent
                </p>
                {typeof streak === 'number' && streak > 0 && (
                  <p className="flex items-center gap-1.5 text-sm text-retro-dark/70">
                    <Sparkles className="h-4 w-4 text-retro-yellow" />
                    Closing today keeps a {streak + 1}-day review streak alive.
                  </p>
                )}
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
        <Button
          variant="ghost"
          size="sm"
          data-testid="close-day-back"
          onClick={() => go(-1)}
          disabled={stepIndex === 0}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        {isLast ? (
          <Button
            data-testid="close-day-finish"
            onClick={finish}
            disabled={!canFinish || isSaving}
            size="lg"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            Close the day
          </Button>
        ) : (
          <Button data-testid="close-day-next" onClick={() => go(1)}>
            Next
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        )}
      </div>

      {canFinish && isLast && (
        <p className="mt-3 flex items-center justify-end gap-1 font-mono text-[11px] text-retro-mint">
          <Check className="h-3 w-3" /> ready
        </p>
      )}
    </Card>
  )
}
