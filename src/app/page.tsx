import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Sparkles, Sunrise, Sprout, BookOpen } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/session'

export default async function HomePage() {
  const user = await getCurrentUser()
  if (user) redirect('/today')
  return (
    <main className="workspace-canvas flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-7">
        <span className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
          <Sparkles className="h-6 w-6 text-primary" />
          NoBrainy.
        </span>
        <Link href="/login" className="rounded-full border bg-card px-5 py-2.5 text-sm font-medium">
          Sign in
        </Link>
      </header>
      <section className="motion-page mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-20">
        <div>
          <p className="eyebrow mb-6 text-primary">Your personal space to move forward</p>
          <h1 className="text-5xl font-semibold leading-[1.07] tracking-[-0.055em] sm:text-7xl">
            A clearer mind.
            <br />
            <span className="text-primary">A fuller life.</span>
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-muted-foreground">
            Make room for your work, your ideas, and the person you want to become. One thoughtful
            day at a time.
          </p>
          <Link
            href="/register"
            className="mt-9 inline-flex items-center gap-4 rounded-2xl bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
          >
            Create your workspace
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-5 text-xs text-muted-foreground">
            A personal workspace. No AI key needed to begin.
          </p>
        </div>
        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute -inset-5 rounded-[3rem] bg-gradient-to-br from-primary/5 via-transparent to-retro-yellow/15"
          />
          <div className="surface relative overflow-hidden p-7 sm:p-9">
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <Sunrise className="h-4 w-4" />A day with intention
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight">
              Less scattered.
              <br />
              More present.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              A small plan. Space to focus. A moment to reflect.
            </p>
            <div className="my-7 h-px bg-border" />
            {[
              {
                icon: Sunrise,
                title: 'Choose what matters',
                copy: 'Bring a little intention to your day.',
              },
              {
                icon: Sprout,
                title: 'Grow through practice',
                copy: 'Connect small actions with meaningful progress.',
              },
              {
                icon: BookOpen,
                title: 'Keep your curiosity close',
                copy: 'A home for ideas worth returning to.',
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <item.icon className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-medium">{item.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <footer className="px-6 pb-8 text-center text-xs text-muted-foreground">
        Built around your life, at your pace.
      </footer>
    </main>
  )
}
