import Link from 'next/link'
import {
  FileText,
  BookOpen,
  Layers,
  Bookmark,
  Film,
  Archive,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  Search,
} from 'lucide-react'

const collections = [
  {
    href: '/notes',
    title: 'Notes',
    subtitle: 'Think clearly. Connect your ideas.',
    icon: FileText,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
  },
  {
    href: '/books',
    title: 'Books',
    subtitle: 'What you read. What you take with you.',
    icon: BookOpen,
    color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  {
    href: '/flashcards',
    title: 'Flashcards',
    subtitle: 'Turn useful ideas into lasting knowledge.',
    icon: Layers,
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
  },
  {
    href: '/bookmarks',
    title: 'Bookmarks',
    subtitle: 'A place for things worth coming back to.',
    icon: Bookmark,
    color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  {
    href: '/watchlist',
    title: 'Watchlist',
    subtitle: 'Make space for curiosity and downtime.',
    icon: Film,
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
  },
  {
    href: '/stash',
    title: 'Stash',
    subtitle: 'Your files, conversations and references.',
    icon: Archive,
    color: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  },
]

export default function LibraryPage() {
  return (
    <div className="space-y-9">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">A space for your curiosity</p>
          <h1 className="display-title">Your library.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Keep what helps you think, learn and live a little better.
          </p>
        </div>
        <Link
          href="/search"
          className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm"
        >
          <Search className="h-4 w-4" />
          Find something
        </Link>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {collections
          .filter((item) => !['/watchlist', '/stash'].includes(item.href))
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="surface group p-6 transition-transform hover:-translate-y-1"
            >
              <div className="mb-7 flex items-center justify-between">
                <span className={`rounded-2xl p-3 ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.subtitle}</p>
            </Link>
          ))}
      </div>
      <section className="surface-soft flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Let learning become practice.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Try an idea, notice what happened, and keep what helps.
          </p>
        </div>
        <div className="flex gap-4 text-sm text-primary">
          <Link href="/growth" className="underline underline-offset-4">
            Your growth
          </Link>
          <Link href="/reviews" className="underline underline-offset-4">
            Make time to reflect
          </Link>
        </div>
      </section>
      <section>
        <p className="eyebrow mb-4">Life, a little more organised</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              href: '/watchlist',
              title: 'Watchlist',
              description: 'Make room for stories and downtime.',
              icon: Film,
            },
            {
              href: '/stash',
              title: 'Stash',
              description: 'Files and private reference spaces.',
              icon: Archive,
            },
            {
              href: '/expenses',
              title: 'Expenses',
              description: 'Understand where your money goes.',
              icon: Wallet,
            },
            {
              href: '/budgets',
              title: 'Budgets',
              description: 'Give your priorities room to grow.',
              icon: PiggyBank,
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="surface-soft flex items-center gap-4 p-5"
            >
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <h2 className="text-sm font-semibold">{item.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
