'use client'

import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export function Toast() {
  const { message, type, hide } = useToast()

  useEffect(() => {
    if (message) {
      const timer = setTimeout(hide, 3000)
      return () => clearTimeout(timer)
    }
  }, [message, hide])

  if (!message) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] animate-in fade-in slide-in-from-bottom-4">
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg',
          type === 'success' ? 'bg-green-600' : 'bg-red-600'
        )}
      >
        {type === 'success' ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {message}
      </div>
    </div>
  )
}
