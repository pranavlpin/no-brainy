'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ─── Decorative Shapes ─── */
function Triangle({ className = '' }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 40 40" className={`w-10 h-10 ${className}`}>
      <polygon points="20,4 36,36 4,36" fill="currentColor" />
    </svg>
  )
}

function Circle({ className = '' }: { className?: string }): React.ReactElement {
  return <div className={`rounded-full ${className}`} />
}

function Zigzag({ className = '' }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 120 20" className={className}>
      <polyline
        points="0,10 15,2 30,18 45,2 60,18 75,2 90,18 105,2 120,10"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
    </svg>
  )
}

function Cross({ className = '' }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 30 30" className={`w-8 h-8 ${className}`}>
      <rect x="12" y="2" width="6" height="26" fill="currentColor" />
      <rect x="2" y="12" width="26" height="6" fill="currentColor" />
    </svg>
  )
}

function Dots({ className = '' }: { className?: string }): React.ReactElement {
  return (
    <div className={`grid grid-cols-3 gap-1.5 ${className}`}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="w-2 h-2 rounded-full bg-retro-dark/30" />
      ))}
    </div>
  )
}

/* ─── Nav Bar ─── */
function NavBar(): React.ReactElement {
  return (
    <nav className="sticky top-0 z-50 bg-retro-cream border-b-4 border-retro-dark">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <span className="font-mono font-bold text-xl sm:text-2xl tracking-tight text-retro-dark">
          NoBrainy<span className="text-retro-pink">.</span>
        </span>
        <div className="hidden sm:flex items-center gap-6">
          <a href="#features" className="font-mono text-sm underline underline-offset-4 decoration-2 text-retro-dark hover:text-retro-blue transition-colors">
            Features
          </a>
        </div>
        <Link href="/login" className="font-mono font-bold text-sm px-4 py-2 bg-retro-yellow text-retro-dark border-3 border-retro-dark shadow-hard hover-shadow-grow">
          Sign In
        </Link>
      </div>
    </nav>
  )
}

/* ─── Hero Section ─── */
function Hero(): React.ReactElement {
  return (
    <section className="relative bg-retro-cream overflow-hidden py-16 sm:py-24 px-4 sm:px-6">
      <Triangle className="absolute top-8 left-[8%] animate-float opacity-70 text-retro-pink" />
      <Circle className="absolute top-16 right-[12%] w-12 h-12 sm:w-16 sm:h-16 animate-float-reverse opacity-60 bg-retro-yellow" />
      <Cross className="absolute bottom-20 left-[15%] animate-spin-slow opacity-50 text-retro-blue" />
      <Circle className="absolute bottom-32 right-[8%] w-8 h-8 animate-float opacity-50 bg-retro-mint" />
      <Zigzag className="absolute top-32 right-[25%] w-24 text-retro-orange opacity-40 animate-float" />
      <Dots className="absolute bottom-12 right-[20%] opacity-30" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h1 className="font-display font-bold text-4xl sm:text-6xl lg:text-7xl leading-[1.1] text-retro-dark mb-6">
          Offload your brain.
          <br />
          <span className="relative inline-block">
            <span className="relative z-10 text-retro-blue">Upgrade</span>
            <span className="absolute -bottom-1 left-0 w-full h-3 sm:h-4 bg-retro-yellow -z-0 -rotate-1" />
          </span>{' '}
          your life.
        </h1>
        <p className="font-body text-base sm:text-lg text-retro-dark/70 max-w-2xl mx-auto mb-10 leading-relaxed">
          The ultimate operating system for your personal growth. Bring your notes, tasks, finances,
          and learning into one frictionless workspace powered by AI.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="font-mono font-bold text-base px-8 py-3 bg-retro-pink text-white border-3 border-retro-dark shadow-hard-lg hover-shadow-grow text-center">
            Deploy for Free
          </Link>
          <a href="#features" className="font-mono font-bold text-base px-8 py-3 bg-retro-cream text-retro-dark border-3 border-retro-dark shadow-hard hover-shadow-grow text-center">
            Explore Modules &darr;
          </a>
        </div>

        {/* Dashboard Mockup */}
        <div className="mt-14 sm:mt-20 relative">
          <div className="border-4 border-retro-dark bg-retro-dark shadow-hard-lg transform rotate-1 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-retro-dark border-b-2 border-retro-cream/20">
              <div className="w-3 h-3 rounded-full bg-retro-pink" />
              <div className="w-3 h-3 rounded-full bg-retro-yellow" />
              <div className="w-3 h-3 rounded-full bg-retro-mint" />
              <span className="font-mono text-xs text-retro-cream/50 ml-2">nobrainy.com</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0">
              {/* Markdown Editor */}
              <div className="bg-retro-dark p-4 border-r-0 sm:border-r-2 border-retro-cream/10">
                <div className="font-mono text-xs text-retro-cream/40 mb-2">notes.md</div>
                <div className="font-mono text-xs leading-relaxed text-left">
                  <span className="text-retro-pink"># </span>
                  <span className="text-retro-cream">Morning Reflections</span><br />
                  <span className="text-retro-cream/50">Today I need to focus on:</span><br />
                  <span className="text-retro-yellow">- </span>
                  <span className="text-retro-cream/70">Ship the new feature</span><br />
                  <span className="text-retro-yellow">- </span>
                  <span className="text-retro-cream/70">Review PRs</span><br />
                  <span className="text-retro-blue">**</span>
                  <span className="text-retro-cream">Important</span>
                  <span className="text-retro-blue">**</span>
                  <span className="text-retro-cream/70">: Call dentist</span>
                </div>
              </div>
              {/* Heatmap */}
              <div className="bg-retro-dark p-4 border-r-0 sm:border-r-2 border-retro-cream/10">
                <div className="font-mono text-xs text-retro-cream/40 mb-2">Activity</div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => {
                    const levels = ['bg-retro-cream/5', 'bg-retro-mint/30', 'bg-retro-mint/50', 'bg-retro-mint/70', 'bg-retro-mint']
                    return <div key={i} className={`w-3 h-3 sm:w-4 sm:h-4 ${levels[i % 5]}`} />
                  })}
                </div>
              </div>
              {/* Pomodoro */}
              <div className="bg-retro-dark p-4 flex flex-col items-center justify-center">
                <div className="font-mono text-xs text-retro-cream/40 mb-3">Pomodoro</div>
                <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(44 100% 95% / 0.1)" strokeWidth="6" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke="hsl(336 100% 58%)"
                      strokeWidth="6"
                      strokeDasharray={`${2 * Math.PI * 42 * 0.65} ${2 * Math.PI * 42 * 0.35}`}
                      strokeLinecap="butt"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-lg sm:text-xl font-bold text-retro-cream">
                    16:20
                  </div>
                </div>
                <span className="font-mono text-xs text-retro-pink mt-2">FOCUS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Feature Mini UIs ─── */
function MarkdownMiniUI(): React.ReactElement {
  return (
    <div className="font-mono text-xs text-left leading-relaxed">
      <span className="text-retro-pink"># </span><span className="text-retro-cream">Quick Note</span><br />
      <span className="text-retro-cream/50">A list of things:</span><br />
      <span className="text-retro-yellow">- </span><span className="text-retro-cream/70">First item</span><br />
      <span className="text-retro-mint">&gt; </span><span className="text-retro-cream/60 italic">A blockquote</span>
    </div>
  )
}

function EisenhowerMiniUI(): React.ReactElement {
  return (
    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
      <div className="bg-retro-pink/30 text-retro-cream p-1.5 text-center border border-retro-pink/50">DO</div>
      <div className="bg-retro-blue/30 text-retro-cream p-1.5 text-center border border-retro-blue/50">SCHEDULE</div>
      <div className="bg-retro-yellow/30 text-retro-dark p-1.5 text-center border border-retro-yellow/50">DELEGATE</div>
      <div className="bg-retro-cream/10 text-retro-cream/50 p-1.5 text-center border border-retro-cream/20">DELETE</div>
    </div>
  )
}

function BookTrackerMiniUI(): React.ReactElement {
  const books = [
    { title: 'Atomic Habits', pct: 85, color: 'bg-retro-mint' },
    { title: 'Deep Work', pct: 42, color: 'bg-retro-blue' },
    { title: 'The Almanack', pct: 100, color: 'bg-retro-yellow' },
  ]
  return (
    <div className="space-y-2 font-mono text-xs text-retro-cream">
      {books.map((b) => (
        <div key={b.title}>
          <div className="flex justify-between mb-0.5">
            <span className="text-retro-cream/70">{b.title}</span>
            <span>{b.pct}%</span>
          </div>
          <div className="h-2 bg-retro-cream/10 border border-retro-cream/20">
            <div className={`h-full ${b.color}`} style={{ width: `${b.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function FlashcardMiniUI(): React.ReactElement {
  const [flipped, setFlipped] = useState(false)
  return (
    <div className="cursor-pointer select-none" onClick={() => setFlipped(!flipped)}>
      <div className={`border-2 border-retro-cream/30 p-3 text-center font-mono text-xs transition-all duration-300 ${flipped ? 'bg-retro-mint/20 text-retro-mint' : 'bg-retro-pink/10 text-retro-cream'}`}>
        {flipped ? (
          <div>
            <div className="text-[10px] text-retro-cream/40 mb-1">ANSWER</div>
            <div>Mitochondria</div>
          </div>
        ) : (
          <div>
            <div className="text-[10px] text-retro-cream/40 mb-1">QUESTION</div>
            <div>Powerhouse of the cell?</div>
          </div>
        )}
      </div>
      <div className="text-[10px] text-retro-cream/30 text-center mt-1 font-mono">click to flip</div>
    </div>
  )
}

function DailyPlannerMiniUI(): React.ReactElement {
  const items = [
    { time: '06:00', task: 'Morning Run', color: 'border-l-retro-mint' },
    { time: '08:00', task: 'Deep Work', color: 'border-l-retro-blue' },
    { time: '10:00', task: 'Standup', color: 'border-l-retro-yellow' },
    { time: '12:00', task: 'Lunch', color: 'border-l-retro-orange' },
    { time: '14:00', task: 'Review PRs', color: 'border-l-retro-pink' },
  ]
  return (
    <div className="font-mono text-[10px] text-retro-cream space-y-0.5">
      {items.map((item) => (
        <div key={item.time} className={`flex gap-2 border-l-2 ${item.color} pl-2 py-1`}>
          <span className="text-retro-cream/40 w-10">{item.time}</span>
          <span>{item.task}</span>
        </div>
      ))}
    </div>
  )
}

function HabitHeatmapMiniUI(): React.ReactElement {
  return (
    <div>
      <div className="grid grid-cols-10 gap-0.5">
        {Array.from({ length: 40 }).map((_, i) => {
          const levels = ['bg-retro-cream/5', 'bg-retro-mint/20', 'bg-retro-mint/40', 'bg-retro-mint/60', 'bg-retro-mint']
          return <div key={i} className={`w-3 h-3 ${levels[i % 5]}`} />
        })}
      </div>
      <div className="flex justify-between mt-1 font-mono text-[9px] text-retro-cream/30">
        <span>Jan</span><span>Mar</span><span>Jun</span><span>Sep</span>
      </div>
    </div>
  )
}

/* ─── Timeline Feature Card ─── */
function TimelineNode({
  index, title, description, children, accentColor,
}: {
  index: number; title: string; description: string; children: React.ReactNode; accentColor: string;
}): React.ReactElement {
  const isLeft = index % 2 === 0
  const shadowClasses = ['shadow-hard-pink', 'shadow-hard-blue', 'shadow-hard-yellow', 'shadow-hard-mint', 'shadow-hard-orange', 'shadow-hard-pink']
  const shadowClass = shadowClasses[index]

  return (
    <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-0">
      <div className={`w-full md:w-5/12 ${isLeft ? 'md:pr-12' : 'md:order-3 md:pl-12'}`}>
        <div className={`border-3 border-retro-dark bg-retro-cream p-5 ${shadowClass} hover-shadow-grow ${isLeft ? 'md:text-right' : ''}`}>
          <div className={`font-mono text-xs uppercase tracking-widest mb-1 text-retro-${accentColor.replace('retro-', '')}`}>
            Module {String(index + 1).padStart(2, '0')}
          </div>
          <h3 className="font-display font-bold text-xl text-retro-dark mb-2">{title}</h3>
          <p className="font-body text-sm text-retro-dark/60 mb-4">{description}</p>
          <div className="border-2 border-retro-dark/20 p-3 bg-retro-dark">{children}</div>
        </div>
      </div>
      <div className="hidden md:flex w-2/12 justify-center relative">
        <div className={`w-8 h-8 border-3 border-retro-dark bg-${accentColor} z-10 rotate-45`} />
      </div>
      <div className={`hidden md:block w-5/12 ${isLeft ? 'md:order-3' : ''}`} />
      <div className="md:hidden absolute -left-2 top-0">
        <div className={`w-5 h-5 border-2 border-retro-dark bg-${accentColor} rotate-45`} />
      </div>
    </div>
  )
}

/* ─── Core Features Timeline ─── */
function FeaturesTimeline(): React.ReactElement {
  const features = [
    { title: 'Markdown Notes', desc: 'Write in plain markdown with syntax highlighting, backlinks, and instant search.', ui: <MarkdownMiniUI />, accent: 'retro-pink' },
    { title: 'Smart Tasks', desc: 'Eisenhower matrix meets GTD. Prioritize ruthlessly, execute relentlessly.', ui: <EisenhowerMiniUI />, accent: 'retro-blue' },
    { title: 'Book Tracker', desc: 'Track every book. Log progress, capture highlights, never lose a reading insight.', ui: <BookTrackerMiniUI />, accent: 'retro-yellow' },
    { title: 'Flashcards', desc: 'Spaced repetition built in. Create, review, and master any subject.', ui: <FlashcardMiniUI />, accent: 'retro-mint' },
    { title: 'Daily Planner', desc: 'Time-block your day. Drag, drop, and own every hour.', ui: <DailyPlannerMiniUI />, accent: 'retro-orange' },
    { title: 'Goals & Habits', desc: 'Track streaks, visualize consistency, build the life you want.', ui: <HabitHeatmapMiniUI />, accent: 'retro-pink' },
  ]
  return (
    <section id="features" className="bg-retro-dark py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
      <Triangle className="absolute top-12 right-[10%] text-retro-yellow opacity-20 animate-float w-16 h-16" />
      <Cross className="absolute bottom-16 left-[8%] opacity-20 animate-spin-slow text-retro-mint" />
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-retro-cream mb-4">
            The Core Productivity{' '}
            <span className="relative inline-block">
              <span className="relative z-10">Engine</span>
              <span className="absolute -bottom-1 left-0 w-full h-3 bg-retro-pink -z-0 rotate-1" />
            </span>
          </h2>
          <p className="font-mono text-sm text-retro-cream/50 uppercase tracking-widest">
            6 modules. Zero friction. Total control.
          </p>
        </div>
        <div className="relative pl-6 md:pl-0">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-retro-cream/20 -translate-x-0.5" />
          <div className="md:hidden absolute left-0 top-0 bottom-0 w-1 bg-retro-cream/20" />
          <div className="space-y-12 md:space-y-16">
            {features.map((f, i) => (
              <TimelineNode key={i} index={i} title={f.title} description={f.desc} accentColor={f.accent}>
                {f.ui}
              </TimelineNode>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Expense Manager ─── */
function ExpenseSection(): React.ReactElement {
  const categories = [
    { name: 'Shopping', amount: '\u20B965,655', pct: 28, color: 'bg-retro-pink' },
    { name: 'Investment', amount: '\u20B93,31,845', pct: 45, color: 'bg-retro-blue' },
    { name: 'Food', amount: '\u20B922,100', pct: 12, color: 'bg-retro-yellow' },
    { name: 'Transport', amount: '\u20B98,440', pct: 8, color: 'bg-retro-mint' },
    { name: 'Bills', amount: '\u20B915,200', pct: 7, color: 'bg-retro-orange' },
  ]
  const total = categories.reduce((s, c) => s + c.pct, 0)
  let cumulativeOffset = 0
  const circumference = 2 * Math.PI * 35
  const hslColors = [
    'hsl(336,100%,58%)', 'hsl(233,100%,59%)', 'hsl(52,100%,50%)',
    'hsl(160,100%,45%)', 'hsl(18,100%,60%)',
  ]

  return (
    <section className="bg-retro-cream py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
      <Circle className="absolute top-10 left-[5%] w-20 h-20 opacity-10 animate-float bg-retro-pink" />
      <Dots className="absolute bottom-10 right-[5%] opacity-20" />
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-retro-pink mb-3">Expense Manager</div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-retro-dark mb-6 leading-tight">
            Master your money{' '}
            <span className="relative inline-block -rotate-2">
              <span className="relative z-10 text-retro-blue">with zero friction.</span>
              <span className="absolute -bottom-1 left-0 w-full h-3 bg-retro-yellow -z-0" />
            </span>
          </h2>
          <div className="space-y-4 font-body text-retro-dark/70 text-sm leading-relaxed">
            <p>Track every rupee across 23+ categories. From daily chai to long-term investments.</p>
            <p>Import bank CSVs in one click. Auto-categorization means less time logging, more time living.</p>
            <p>Monthly breakdowns, trend analysis, and category charts. Your wallet will thank you.</p>
          </div>
          <div className="mt-6 flex gap-3 flex-wrap">
            {['23+ Categories', 'CSV Import', 'Bulk Entry'].map((tag) => (
              <span key={tag} className="font-mono text-xs px-3 py-1 border-2 border-retro-dark bg-retro-yellow text-retro-dark shadow-hard">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="border-4 border-retro-dark bg-retro-dark p-6 shadow-hard-lg">
          <div className="font-mono text-xs text-retro-cream/40 mb-4 uppercase tracking-widest">Monthly Overview</div>
          <div className="flex justify-center mb-6">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {categories.map((cat, i) => {
                  const segmentLength = (cat.pct / total) * circumference
                  const offset = (cumulativeOffset / total) * circumference
                  cumulativeOffset += cat.pct
                  return (
                    <circle
                      key={i}
                      cx="50" cy="50" r="35"
                      fill="none"
                      stroke={hslColors[i]}
                      strokeWidth="12"
                      strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                      strokeDashoffset={-offset}
                    />
                  )
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-lg sm:text-xl font-bold text-retro-cream">{'\u20B9'}4.4L</span>
                <span className="font-mono text-[10px] text-retro-cream/40">TOTAL</span>
              </div>
            </div>
          </div>
          <div className="space-y-0">
            {categories.map((cat, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-t-2 border-retro-cream/10 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 ${cat.color}`} />
                  <span className="text-retro-cream/70">{cat.name}</span>
                </div>
                <span className="text-retro-cream font-bold">{cat.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── How It Works ─── */
function HowItWorks(): React.ReactElement {
  const steps = [
    { num: '01', title: 'Capture', desc: 'Dump everything into NoBrainy. Notes, tasks, expenses, ideas — just get it out of your head.' },
    { num: '02', title: 'Organize', desc: 'Let modules auto-sort your chaos. Tasks get prioritized. Notes get linked. Expenses get categorized.' },
    { num: '03', title: 'Reflect', desc: 'Weekly reviews, habit streaks, expense trends. See how far you\'ve come and where to go next.' },
  ]
  return (
    <section className="bg-retro-cream py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
      <Zigzag className="absolute top-6 left-[10%] w-28 text-retro-orange opacity-30" />
      <Triangle className="absolute bottom-10 right-[8%] w-12 h-12 opacity-20 animate-float-reverse text-retro-blue" />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-retro-dark mb-3">How It Works</h2>
          <p className="font-mono text-sm text-retro-dark/50 uppercase tracking-widest">Three steps to sanity</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 relative">
          <div className="hidden md:block absolute top-14 left-[20%] right-[20%] border-t-[3px] border-dashed border-retro-dark/30" />
          {steps.map((step, i) => (
            <div key={i} className="relative text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 border-4 border-retro-dark bg-retro-cream shadow-hard mb-4 relative z-10">
                <span className="font-mono font-bold text-2xl text-retro-dark">{step.num}</span>
              </div>
              <h3 className="font-display font-bold text-xl text-retro-dark mb-2">{step.title}</h3>
              <p className="font-body text-sm text-retro-dark/60 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Trust & Privacy ─── */
function TrustSection(): React.ReactElement {
  return (
    <section className="bg-retro-dark py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
      <Cross className="absolute top-8 left-[5%] opacity-20 animate-spin-slow text-retro-yellow" />
      <Circle className="absolute bottom-8 right-[5%] w-10 h-10 opacity-15 animate-float bg-retro-pink" />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-retro-cream mb-3">
            Your Data. Your{' '}
            <span className="relative inline-block">
              <span className="relative z-10">Rules.</span>
              <span className="absolute -bottom-1 left-0 w-full h-3 bg-retro-yellow -z-0 -rotate-1" />
            </span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-4 border-retro-cream bg-retro-pink p-8 shadow-hard-lg hover-shadow-grow">
            <h3 className="font-display font-bold text-2xl text-retro-cream mb-3">Private AI</h3>
            <p className="font-body text-sm text-retro-cream/80 leading-relaxed mb-4">
              Bring Your Own Key. Connect your OpenAI API key and keep every prompt, every response, completely private.
            </p>
            <div className="flex gap-2 flex-wrap">
              {['BYOK', 'OpenAI', 'Local LLMs'].map((tag) => (
                <span key={tag} className="font-mono text-[10px] px-2 py-1 border-2 border-retro-cream text-retro-cream uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="border-4 border-retro-cream bg-retro-blue p-8 shadow-hard-lg hover-shadow-grow">
            <h3 className="font-display font-bold text-2xl text-retro-cream mb-3">Total Control</h3>
            <p className="font-body text-sm text-retro-cream/80 leading-relaxed mb-4">
              Self-host on your own server. Docker, GCP, or bare metal. Your data never leaves your infrastructure.
            </p>
            <div className="flex gap-2 flex-wrap">
              {['Docker', 'GCP', 'Self-Hosted'].map((tag) => (
                <span key={tag} className="font-mono text-[10px] px-2 py-1 border-2 border-retro-cream text-retro-cream uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Footer CTA ─── */
function FooterCTA(): React.ReactElement {
  return (
    <section className="bg-retro-cream py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
      <Triangle className="absolute top-6 left-[10%] w-14 h-14 opacity-15 animate-float text-retro-pink" />
      <Circle className="absolute bottom-6 right-[10%] w-10 h-10 opacity-15 animate-float-reverse bg-retro-yellow" />
      <div className="max-w-3xl mx-auto text-center relative">
        <h2 className="font-display font-bold text-3xl sm:text-5xl lg:text-6xl text-retro-dark mb-4 leading-tight">
          Start organizing your{' '}
          <span className="relative inline-block">
            <span className="relative z-10 text-retro-pink">mind</span>
            <span className="absolute -bottom-1 left-0 w-full h-3 sm:h-4 bg-retro-yellow -z-0 rotate-1" />
          </span>{' '}
          today.
        </h2>
        <p className="font-body text-sm sm:text-base text-retro-dark/60 mb-8">
          Deploy in minutes. Start building better habits today.
        </p>
        <Link href="/register" className="inline-block font-mono font-bold text-lg px-10 py-4 bg-retro-pink text-white border-4 border-retro-dark shadow-hard-lg hover-shadow-grow">
          Get Started Now &rarr;
        </Link>
      </div>
    </section>
  )
}

/* ─── Footer ─── */
function PageFooter(): React.ReactElement {
  return (
    <footer className="bg-retro-dark border-t-4 border-retro-cream py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-mono font-bold text-lg text-retro-cream">
          NoBrainy<span className="text-retro-pink">.</span>
        </span>
        <div className="flex gap-6">
          {[
            { label: 'GitHub', href: 'https://github.com/pranavlpin/no-brainy' },
            { label: 'Sign In', href: '/login' },
          ].map((link) => (
            <Link key={link.label} href={link.href} className="font-mono text-xs text-retro-cream/50 underline underline-offset-4 hover:text-retro-yellow transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
        <span className="font-mono text-xs text-retro-cream/30">
          &copy; 2026 NoBrainy.
        </span>
      </div>
    </footer>
  )
}

/* ─── Main Page ─── */
export default function LandingPage(): React.ReactElement {
  return (
    <div className="min-h-screen">
      <NavBar />
      <Hero />
      <FeaturesTimeline />
      <ExpenseSection />
      <HowItWorks />
      <TrustSection />
      <FooterCTA />
      <PageFooter />
    </div>
  )
}
