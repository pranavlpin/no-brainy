'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

const labelMap: Record<string, string> = {
  notes: 'Notes',
  tasks: 'Tasks',
  books: 'Books',
  flashcards: 'Flashcards',
  planner: 'Planner',
  reviews: 'Reviews',
  goals: 'Goals',
  search: 'Search',
  analytics: 'Analytics',
  settings: 'Settings',
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) {
    return <span className="text-sm text-muted-foreground">Home</span>
  }

  return (
    <nav className="flex items-center gap-1 text-sm">
      {segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/')
        const label = labelMap[segment] ?? segment
        const isLast = index === segments.length - 1

        return (
          <span key={href} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link href={href} className="text-muted-foreground hover:text-foreground">
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
