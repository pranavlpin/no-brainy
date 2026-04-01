'use client'

import { useApiKeyStatus } from './use-settings'

export function useAI() {
  const { data, isLoading } = useApiKeyStatus()
  return {
    isEnabled: data?.hasKey ?? false,
    isLoading,
  }
}
