import Link from 'next/link'
import {
  FileText,
  CheckSquare,
  BookOpen,
  Brain,
  Calendar,
  Target,
  Lock,
  ArrowRight,
  TrendingUp,
  Wallet,
  Sparkles,
  Lightbulb,
  Search,
  BarChart3,
  Upload,
  Timer,
  Layers,
} from 'lucide-react'

const coreFeatures = [
  {
    icon: FileText,
    title: 'Markdown Notes',
    description:
      'Write in Markdown, think in clarity. Wiki-links, Mermaid diagrams, bi-directional linking, and full-text search.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: CheckSquare,
    title: 'Smart Tasks',
    description:
      'Eisenhower Matrix, nested subtasks, recurring tasks, and AI-powered prioritization. Know what matters.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: BookOpen,
    title: 'Book Tracker',
    description:
      'Capture key ideas, quotes, and learnings. Track reading progress. Turn every book into actionable knowledge.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: Layers,
    title: 'Flashcards & Quizzes',
    description:
      'SM-2 spaced repetition, multiple card types, quiz mode with scoring. Remember everything you learn.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: Calendar,
    title: 'Daily Planner',
    description:
      'Focus on 3 key tasks. Time blocking, carry-forward incomplete items, and AI-powered daily briefs.',
    color: 'bg-cyan-100 text-cyan-600',
  },
  {
    icon: Target,
    title: 'Goals & Habits',
    description:
      'Set goals, track habits daily, visualize streaks with calendar heatmaps. Build consistency that lasts.',
    color: 'bg-rose-100 text-rose-600',
  },
]

const newFeatures = [
  {
    icon: Wallet,
    title: 'Expense Manager',
    description:
      'Track spending with 23+ categories. Import bank CSV/SMS exports. Interactive charts and month-by-month matrix view.',
    color: 'bg-indigo-100 text-indigo-600',
    tag: 'New',
  },
  {
    icon: TrendingUp,
    title: 'Analytics Dashboard',
    description:
      'Completion charts, productivity breakdowns, activity heatmaps. See your patterns at a glance.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: BarChart3,
    title: 'Daily & Weekly Reviews',
    description:
      'Reflect on your day with auto-aggregated stats, mood tracking, and AI-generated summaries.',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    icon: Search,
    title: 'Global Search',
    description:
      'Full-text search across notes, tasks, books, and more. Find anything instantly with PostgreSQL-powered search.',
    color: 'bg-slate-100 text-slate-600',
  },
  {
    icon: Lightbulb,
    title: 'Smart Insights',
    description:
      'AI-powered pattern detection across all your data. Get actionable suggestions to improve your workflow.',
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    icon: Timer,
    title: 'Focus Mode & Pomodoro',
    description:
      'Distraction-free focus sessions with a built-in Pomodoro timer. Track your deep work hours.',
    color: 'bg-teal-100 text-teal-600',
  },
]

const steps = [
  {
    number: 1,
    title: 'Capture',
    description: 'Notes, tasks, expenses, book highlights — capture everything as it comes to you.',
  },
  {
    number: 2,
    title: 'Organize',
    description: 'Link notes, categorize expenses, prioritize tasks, and structure your knowledge.',
  },
  {
    number: 3,
    title: 'Reflect',
    description: 'Review your day, track spending, visualize habits, and let AI surface insights.',
  },
]

const highlights = [
  { label: '12+ Modules', description: 'Notes, Tasks, Books, Flashcards, Planner, Expenses & more' },
  { label: 'AI-Powered', description: 'Bring your own OpenAI key for summaries, prioritization & insights' },
  { label: 'Import Ready', description: 'CSV & SMS import for bank transactions with auto-categorization' },
  { label: 'Self-Hosted', description: 'Deploy on your own GCP Cloud Run. Your data stays yours' },
]

export default function LandingPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Think less. <span className="text-indigo-600">Do more.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Your second brain for notes, tasks, books, expenses, and learning — all in one
            place. 12+ integrated modules. AI-powered insights. Zero friction.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              See Features
            </a>
          </div>
          {/* Highlight pills */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            {highlights.map((h) => (
              <span
                key={h.label}
                className="inline-flex items-center rounded-full bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm border border-gray-100"
                title={h.description}
              >
                {h.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="bg-gray-50 py-24 scroll-mt-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Core Productivity Suite
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600">
            Six powerful modules for capturing, organizing, and retaining knowledge.
          </p>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coreFeatures.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${feature.color}`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New & Advanced Features */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Beyond the Basics
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600">
            Analytics, expense tracking, AI insights, and more — tools that grow with you.
          </p>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {newFeatures.map((feature) => (
              <div
                key={feature.title}
                className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {'tag' in feature && feature.tag && (
                  <span className="absolute top-4 right-4 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    {feature.tag}
                  </span>
                )}
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${feature.color}`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expense Manager Spotlight */}
      <section className="bg-gradient-to-br from-indigo-50 to-blue-50 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                New Feature
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Expense Manager
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Track every rupee with smart categorization, interactive charts, and
                bank import support.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  '23 preset categories with custom icons & colors',
                  'Import CSV bank statements or SMS transaction texts',
                  'Auto-categorize expenses with keyword matching',
                  'Monthly matrix view (Category x Month with totals)',
                  'Interactive charts: donut, trends, bar charts',
                  'Indian Rupee formatting (₹1,23,456)',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
              <div className="space-y-3">
                {[
                  { cat: 'Shopping', color: '#F59E0B', amount: '₹65,655' },
                  { cat: 'Food Order', color: '#EF4444', amount: '₹3,480' },
                  { cat: 'EMI', color: '#8B5CF6', amount: '₹50,000' },
                  { cat: 'Investment', color: '#16A34A', amount: '₹3,31,845' },
                  { cat: 'Subscriptions', color: '#7C3AED', amount: '₹7,543' },
                  { cat: 'Bills', color: '#84CC16', amount: '₹804' },
                ].map((row) => (
                  <div key={row.cat} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: row.color }} />
                      <span className="text-sm font-medium text-gray-700">{row.cat}</span>
                    </div>
                    <span className="text-sm font-mono text-gray-900">{row.amount}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-gray-300">
                  <span className="text-sm font-semibold text-gray-900">Total</span>
                  <span className="text-sm font-mono font-bold text-indigo-600">₹4,59,327</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How it works
          </h2>
          <div className="mt-16 grid gap-12 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
                  {step.number}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <Sparkles className="h-6 w-6 text-amber-600" />
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                AI That Works for You
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                Bring your own OpenAI API key. Your key, your data, your control.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { icon: FileText, text: 'Summarize notes and extract key takeaways' },
                { icon: Layers, text: 'Auto-generate flashcards from notes and books' },
                { icon: CheckSquare, text: 'AI task prioritization and daily planning' },
                { icon: BarChart3, text: 'Daily review summaries with mood analysis' },
                { icon: Lightbulb, text: 'Pattern detection and smart suggestions' },
                { icon: Upload, text: 'Auto-categorize imported expenses' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 rounded-lg bg-white p-4 border border-gray-200">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-50">
                    <item.icon className="h-4 w-4 text-indigo-600" />
                  </div>
                  <span className="text-sm text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Lock className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Your Data. Your Server.
          </h2>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            Self-host on GCP Cloud Run or any Docker-compatible platform. No vendor
            lock-in. No data harvesting. Open-source and transparent.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-indigo-600 to-blue-700 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Start organizing your mind today
          </h2>
          <p className="mt-4 text-lg text-indigo-100">
            Free to use. No credit card required. Deploy in minutes.
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-indigo-600 shadow-md hover:bg-indigo-50 transition-colors"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-12">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">NoBrainy</span>
          </div>
          <p className="text-sm text-gray-500">
            Your personal productivity and learning operating system.
          </p>
          <div className="mt-4 flex items-center justify-center gap-6">
            <a
              href="https://github.com/pranavlpin/no-brainy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              GitHub
            </a>
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
