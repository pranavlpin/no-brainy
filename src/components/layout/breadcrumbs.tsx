'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { labelFor } from '@/lib/nav/items'
import { useBreadcrumbTitle } from '@/stores/breadcrumb-store'

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

/** A segment with no known label below the first level is an entity id. */
function isOpaqueId(segment: string, index: number): boolean {
  if (index === 0) return false
  return labelFor(segment) === segment
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const entityTitle = useBreadcrumbTitle((s) => s.title)
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) {
    return (
      <span className="text-sm font-medium text-foreground" data-testid="breadcrumbs">
        Today
      </span>
    )
  }

  return (
    <nav
      className="flex items-center gap-1 text-sm"
      aria-label="Breadcrumb"
      data-testid="breadcrumbs"
    >
      {segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/')
        const isLast = index === segments.length - 1
        const label = isOpaqueId(segment, index)
          ? (isLast && entityTitle) || (DATE_KEY.test(segment) ? segment : 'Detail')
          : labelFor(segment)

        return (
          <span key={href} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            {isLast ? (
              <span className="max-w-[40vw] truncate font-medium text-foreground">{label}</span>
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
