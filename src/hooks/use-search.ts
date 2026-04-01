'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { SearchResponse } from '@/lib/types/search'
import type { ApiResponse } from '@/lib/types/api'
import { useState, useEffect } from 'react'

const SEARCH_KEY = ['search'] as const

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

export function useGlobalSearch(
  query: string,
  type: 'all' | 'note' | 'task' | 'book' | 'flashcard' = 'all'
) {
  const debouncedQuery = useDebounce(query.trim(), 300)

  return useQuery({
    queryKey: [...SEARCH_KEY, debouncedQuery, type],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('q', debouncedQuery)
      if (type !== 'all') params.set('type', type)
      const res = await apiClient<ApiResponse<SearchResponse>>(
        `/api/search?${params.toString()}`
      )
      return res.data
    },
    enabled: debouncedQuery.length > 0,
    staleTime: 30_000,
  })
}
