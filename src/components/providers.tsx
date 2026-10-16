'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ThemeInitializer } from '@/components/theme-initializer'
import { MotionProvider } from '@/components/motion/motion-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60 * 1000 } },
      })
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <MotionProvider>
          <ThemeInitializer />
          {children}
        </MotionProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
