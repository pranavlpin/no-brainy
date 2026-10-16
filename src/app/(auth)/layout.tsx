import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="workspace-canvas flex min-h-dvh flex-col">
      <header className="px-6 py-6 sm:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-xl font-semibold tracking-tight"
        >
          <span className="rounded-xl bg-primary p-2 text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </span>
          NoBrainy<span className="text-primary">.</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-14">
        <div className="surface motion-page w-full max-w-md p-7 sm:p-10">{children}</div>
      </main>
      <p className="pb-6 text-center text-xs text-muted-foreground">
        A little more clarity. A little more you.
      </p>
    </div>
  )
}
