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
    <html lang="en">
      {GA_ID && (
        <head>
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
        </head>
      )}
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
