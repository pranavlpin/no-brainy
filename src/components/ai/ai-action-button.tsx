'use client'

import { useAI } from '@/hooks/use-ai'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'

interface AIActionButtonProps {
  label: string
  onClick: () => void
  isLoading?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default'
  className?: string
}

export function AIActionButton({
  label,
  onClick,
  isLoading = false,
  variant = 'outline',
  size = 'sm',
  className,
}: AIActionButtonProps) {
  const { isEnabled, isLoading: isCheckingKey } = useAI()

  if (isCheckingKey) return null

  if (!isEnabled) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled
        className={className}
        title="Add your OpenAI API key in Settings to unlock AI features"
      >
        <Sparkles className="h-4 w-4 mr-1 opacity-50" />
        {label}
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 mr-1" />
      )}
      {isLoading ? 'Processing...' : label}
    </Button>
  )
}
