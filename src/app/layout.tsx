import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { GoogleAnalytics } from '@/components/analytics-scripts'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export const metadata: Metadata = {
  title: {
    default: 'NoBrainy — Personal Productivity & Learning Hub',
    template: '%s | NoBrainy',
  },
  description:
    'Your second brain for notes, tasks, expenses, books, and learning. Markdown editor, expense tracker, flashcards, daily planner, AI insights — all in one workspace.',
  keywords: [
    'productivity',
    'notes',
    'tasks',
    'expense tracker',
    'flashcards',
    'spaced repetition',
    'daily planner',
    'markdown editor',
    'personal knowledge management',
  ],
  authors: [{ name: 'NoBrainy' }],
  metadataBase: new URL('https://nobrainy.com'),
  openGraph: {
    title: 'NoBrainy — Personal Productivity & Learning Hub',
    description:
      'Your second brain for notes, tasks, expenses, books, and learning. All in one workspace.',
    url: 'https://nobrainy.com',
    siteName: 'NoBrainy',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NoBrainy — Personal Productivity & Learning Hub',
    description: 'Your second brain for notes, tasks, expenses, books, and learning.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192' },
    ],
    apple: '/icons/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NoBrainy',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFF6E5' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0D1A' },
  ],
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function() {
            try {
              var dm = localStorage.getItem('nobrainy-dark-mode');
              var isDark = dm === 'dark' || (dm !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
              if (isDark) {
                document.documentElement.classList.add('dark');
                document.documentElement.classList.remove('light');
              } else {
                document.documentElement.classList.add('light');
                document.documentElement.classList.remove('dark');
              }
              var t = localStorage.getItem('nobrainy-theme');
              if (t === 'custom') {
                var customs = JSON.parse(localStorage.getItem('nobrainy-custom-themes') || '[]');
                var activeId = localStorage.getItem('nobrainy-active-custom-theme');
                var active = customs.find(function(c) { return c.id === activeId; });
                if (active && active.colors) {
                  Object.keys(active.colors).forEach(function(k) {
                    document.documentElement.style.setProperty(k, active.colors[k]);
                  });
                }
              } else if (t && t !== 'retro') {
                document.documentElement.classList.add('theme-' + t);
              }
            } catch(e) {}
          })()
        `,
          }}
        />
        <GoogleAnalytics gaId={GA_ID} />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
