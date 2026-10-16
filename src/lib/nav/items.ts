import {
  Archive,
  BarChart3,
  BookOpen,
  Bookmark,
  Calendar,
  CheckSquare,
  FileText,
  Film,
  Layers,
  Lightbulb,
  PiggyBank,
  Search,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export type NavGroupKey = 'today' | 'capture' | 'do' | 'learn' | 'money' | 'reflect' | 'more'

export interface NavItemDef {
  href: string
  label: string
  icon: LucideIcon
  group: NavGroupKey
  /** Extra words the command palette should match. */
  keywords?: string[]
}

export interface NavGroupDef {
  key: NavGroupKey
  label: string
}

export const NAV_GROUPS: NavGroupDef[] = [
  { key: 'today', label: 'Today' },
  { key: 'capture', label: 'Capture' },
  { key: 'do', label: 'Do' },
  { key: 'learn', label: 'Learn' },
  { key: 'money', label: 'Money' },
  { key: 'reflect', label: 'Reflect' },
  { key: 'more', label: 'More' },
]

/** Single source of truth for navigable sections. */
export const NAV_ITEMS: NavItemDef[] = [
  { href: '/', label: 'Today', icon: Sun, group: 'today', keywords: ['home', 'dashboard'] },
  { href: '/stash', label: 'Stash', icon: Archive, group: 'capture', keywords: ['inbox', 'links'] },
  {
    href: '/notes',
    label: 'Notes',
    icon: FileText,
    group: 'capture',
    keywords: ['markdown', 'write'],
  },
  { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark, group: 'capture', keywords: ['links'] },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare, group: 'do', keywords: ['todo'] },
  {
    href: '/planner',
    label: 'Planner',
    icon: Calendar,
    group: 'do',
    keywords: ['plan', 'focus', 'day'],
  },
  { href: '/goals', label: 'Goals', icon: Target, group: 'do' },
  {
    href: '/flashcards',
    label: 'Flashcards',
    icon: Layers,
    group: 'learn',
    keywords: ['review', 'cards', 'decks'],
  },
  { href: '/books', label: 'Books', icon: BookOpen, group: 'learn', keywords: ['reading'] },
  {
    href: '/expenses',
    label: 'Expenses',
    icon: Wallet,
    group: 'money',
    keywords: ['spend', 'money'],
  },
  { href: '/budgets', label: 'Budgets', icon: PiggyBank, group: 'money' },
  {
    href: '/reviews',
    label: 'Reviews',
    icon: BarChart3,
    group: 'reflect',
    keywords: ['nightly', 'close the day', 'reflect'],
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: TrendingUp,
    group: 'reflect',
    keywords: ['stats', 'charts'],
  },
  { href: '/insights', label: 'Insights', icon: Lightbulb, group: 'reflect', keywords: ['ai'] },
  { href: '/ai', label: 'AI Coach', icon: Sparkles, group: 'reflect', keywords: ['chat', 'coach'] },
  {
    href: '/watchlist',
    label: 'Watchlist',
    icon: Film,
    group: 'more',
    keywords: ['movies', 'shows'],
  },
  { href: '/search', label: 'Search', icon: Search, group: 'more' },
]

export const NAV_ITEMS_BY_HREF: Record<string, NavItemDef> = Object.fromEntries(
  NAV_ITEMS.map((i) => [i.href, i])
)

/** Human label for a path segment or href, used by breadcrumbs. */
export function labelFor(hrefOrSegment: string): string {
  const href = hrefOrSegment.startsWith('/') ? hrefOrSegment : `/${hrefOrSegment}`
  const item = NAV_ITEMS_BY_HREF[href]
  if (item) return item.label
  const extra: Record<string, string> = {
    '/settings': 'Settings',
    '/notifications': 'Notifications',
    '/new': 'New',
    '/graph': 'Graph',
    '/review': 'Review',
    '/quiz': 'Quiz',
    '/daily': 'Daily',
    '/categories': 'Categories',
    '/theme-builder': 'Theme builder',
  }
  return extra[href] ?? hrefOrSegment.replace(/^\//, '')
}

/** Go-to chord targets: press `g` then the key. */
export const GOTO_CHORDS: Record<string, string> = {
  h: '/',
  t: '/tasks',
  p: '/planner',
  n: '/notes',
  r: '/reviews',
  g: '/goals',
  s: '/stash',
  f: '/flashcards',
  b: '/books',
  e: '/expenses',
}
