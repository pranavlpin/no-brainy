import { create } from 'zustand'
import { useEffect } from 'react'

interface BreadcrumbTitleState {
  title: string | null
  setTitle: (title: string | null) => void
}

/** Detail pages publish the entity title here so breadcrumbs can show it instead of an id. */
export const useBreadcrumbTitle = create<BreadcrumbTitleState>((set) => ({
  title: null,
  setTitle: (title) => set({ title }),
}))

/** Publish a breadcrumb title while the calling page is mounted. */
export function useSetBreadcrumbTitle(title: string | null | undefined): void {
  const setTitle = useBreadcrumbTitle((s) => s.setTitle)
  useEffect(() => {
    setTitle(title ?? null)
    return () => setTitle(null)
  }, [title, setTitle])
}
