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
} from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'Markdown Notes',
    description:
      'Write in Markdown, think in clarity. Wiki-links, Mermaid diagrams, and full-text search built in.',
  },
  {
    icon: CheckSquare,
    title: 'Smart Tasks',
    description:
      "Eisenhower Matrix, subtasks, recurring tasks. Know what matters, ignore what doesn't.",
  },
  {
    icon: BookOpen,
    title: 'Book Tracker',
    description:
      'Capture key ideas, quotes, and learnings. Turn every book into actionable knowledge.',
  },
  {
    icon: Brain,
    title: 'Flashcards',
    description:
      'SM-2 spaced repetition. Remember everything you learn, effortlessly.',
  },
  {
    icon: Calendar,
    title: 'Daily Planner',
    description:
      'Focus on 3 things. Carry forward what you missed. Review what you did.',
  },
  {
    icon: Target,
    title: 'Goals & Habits',
    description:
      'Track streaks, build consistency, see progress. Your habits visualized.',
  },
]

const steps = [
  {
    number: 1,
    title: 'Capture',
    description: 'Jot down notes, tasks, book highlights, and ideas as they come to you.',
  },
  {
    number: 2,
    title: 'Organize',
    description: 'Link notes together, prioritize tasks, and structure your knowledge.',
  },
  {
    number: 3,
    title: 'Reflect',
    description: 'Review your day, track habits, and let spaced repetition cement your learning.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Think less. Do more.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Your second brain for notes, tasks, books, and learning — all in one
            place. No complexity. No friction. No brainy stuff required.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              See Features
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="bg-gray-50 py-24 scroll-mt-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to stay focused
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600">
            Six powerful modules, one simple workspace.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <feature.icon className="h-5 w-5 text-blue-600" />
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

      {/* How It Works Section */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How it works
          </h2>
          <div className="mt-16 grid gap-12 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
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
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
            <Lock className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Bring Your Own AI
          </h2>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            Add your OpenAI API key and unlock AI-powered summaries, flashcard
            generation, task prioritization, and intelligent insights. Your key,
            your control.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Start organizing your mind today
          </h2>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
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
          <p className="text-sm text-gray-500">
            Built with focus. Powered by NoBrainy.
          </p>
          <div className="mt-4 flex items-center justify-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              GitHub
            </a>
            <a
              href="/docs"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
