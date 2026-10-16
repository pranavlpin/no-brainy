'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLayoutEffect, useState } from 'react'
import { useUIStore } from '@/stores/ui-store'
import { ThemeInitializer } from '@/components/theme-initializer'

function OwnerQueries({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60 * 1000 } },
      })
  )
  useLayoutEffect(() => {
    useUIStore.getState().exitFocusMode()
    useUIStore.getState().setMobileSidebarOpen(false)
    return () => {
      queryClient.clear()
    }
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer />
      {children}
    </QueryClientProvider>
  )
}

function AccountBoundary({ children }: { children: React.ReactNode }) {
  const { data } = useSession()
  return <OwnerQueries key={data?.user?.id ?? 'anonymous'}>{children}</OwnerQueries>
}

/** Remount private state and allocate a new query cache whenever the authenticated owner changes. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AccountBoundary>{children}</AccountBoundary>
    </SessionProvider>
  )
}
