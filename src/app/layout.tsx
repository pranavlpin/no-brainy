import type { Metadata } from "next"
import Script from "next/script"
import { Inter } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export const metadata: Metadata = {
  title: {
    default: "NoBrainy — Personal Productivity & Learning Hub",
    template: "%s | NoBrainy",
  },
  description: "Your second brain for notes, tasks, expenses, books, and learning. Markdown editor, expense tracker, flashcards, daily planner, AI insights — all in one workspace.",
  keywords: ["productivity", "notes", "tasks", "expense tracker", "flashcards", "spaced repetition", "daily planner", "habit tracker", "markdown editor", "personal knowledge management"],
  authors: [{ name: "NoBrainy" }],
  metadataBase: new URL("https://nobrainy.com"),
  openGraph: {
    title: "NoBrainy — Personal Productivity & Learning Hub",
    description: "Your second brain for notes, tasks, expenses, books, and learning. All in one workspace.",
    url: "https://nobrainy.com",
    siteName: "NoBrainy",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "NoBrainy — Personal Productivity & Learning Hub",
    description: "Your second brain for notes, tasks, expenses, books, and learning.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: `
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
        `}} />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
