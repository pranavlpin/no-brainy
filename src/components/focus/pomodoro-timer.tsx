'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, RotateCcw } from 'lucide-react'

type TimerState = 'idle' | 'working' | 'break' | 'paused'

const WORK_DURATION = 25 * 60 // 25 minutes in seconds
const SHORT_BREAK = 5 * 60 // 5 minutes
const LONG_BREAK = 15 * 60 // 15 minutes
const POMODOROS_BEFORE_LONG_BREAK = 4

interface PomodoroTimerProps {
  className?: string
}

export function PomodoroTimer({ className }: PomodoroTimerProps) {
  const [state, setState] = useState<TimerState>('idle')
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION)
  const [totalTime, setTotalTime] = useState(WORK_DURATION)
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [pausedFrom, setPausedFrom] = useState<TimerState | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<AudioContext | null>(null)

  const playBeep = useCallback(() => {
    try {
      const ctx = audioRef.current ?? new AudioContext()
      audioRef.current = ctx
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 800
      gain.gain.value = 0.3
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    } catch {
      // Audio not available
    }
  }, [])

  const startWork = useCallback(() => {
    setTimeLeft(WORK_DURATION)
    setTotalTime(WORK_DURATION)
    setState('working')
    setPausedFrom(null)
  }, [])

  const startBreak = useCallback(() => {
    const isLongBreak = (pomodoroCount + 1) % POMODOROS_BEFORE_LONG_BREAK === 0
    const breakTime = isLongBreak ? LONG_BREAK : SHORT_BREAK
    setTimeLeft(breakTime)
    setTotalTime(breakTime)
    setState('break')
    setPausedFrom(null)
  }, [pomodoroCount])

  const handleTimerEnd = useCallback(() => {
    playBeep()
    if (state === 'working') {
      setPomodoroCount((c) => c + 1)
      startBreak()
    } else if (state === 'break') {
      startWork()
    }
  }, [state, playBeep, startBreak, startWork])

  useEffect(() => {
    if (state === 'working' || state === 'break') {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            handleTimerEnd()
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state, handleTimerEnd])

  const togglePause = useCallback(() => {
    if (state === 'paused' && pausedFrom) {
      setState(pausedFrom)
      setPausedFrom(null)
    } else if (state === 'working' || state === 'break') {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setPausedFrom(state)
      setState('paused')
    }
  }, [state, pausedFrom])

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setState('idle')
    setTimeLeft(WORK_DURATION)
    setTotalTime(WORK_DURATION)
    setPausedFrom(null)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        if (state === 'idle') {
          startWork()
        } else {
          togglePause()
        }
      } else if (e.code === 'KeyR' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        reset()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state, togglePause, reset, startWork])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0

  // SVG circle properties
  const size = 200
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)

  const stateLabel =
    state === 'idle'
      ? 'Ready'
      : state === 'working'
        ? 'Focus'
        : state === 'break'
          ? 'Break'
          : 'Paused'

  const ringColor =
    state === 'break'
      ? 'stroke-green-500'
      : state === 'paused'
        ? 'stroke-yellow-500'
        : 'stroke-primary'

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-4">
        {/* Circular progress */}
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-muted/20"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className={`transition-all duration-1000 ${ringColor}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-mono font-bold tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-sm text-muted-foreground mt-1">{stateLabel}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {state === 'idle' ? (
            <Button onClick={startWork} size="lg">
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
          ) : (
            <>
              <Button onClick={togglePause} variant="outline" size="lg">
                {state === 'paused' ? (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                )}
              </Button>
              <Button onClick={reset} variant="ghost" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Session counter */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: POMODOROS_BEFORE_LONG_BREAK }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${
                i < pomodoroCount % POMODOROS_BEFORE_LONG_BREAK
                  ? 'bg-primary'
                  : 'bg-muted-foreground/20'
              }`}
            />
          ))}
          <span className="ml-2 text-xs text-muted-foreground">
            {pomodoroCount} pomodoro{pomodoroCount !== 1 ? 's' : ''} completed
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground/60">
          Space = pause/resume &middot; R = reset
        </p>
      </div>
    </div>
  )
}
