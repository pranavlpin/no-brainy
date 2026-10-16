'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  variant?: 'default' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Hide the top-right close button. */
  hideClose?: boolean
}

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
} as const

/**
 * Accessible modal dialog built on Radix (portal, focus trap, scroll lock,
 * Escape and outside-click dismissal) with framer-motion enter and exit.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
  size = 'md',
  hideClose = false,
}: DialogProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-retro-dark/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                data-testid="dialog-panel"
                className={cn(
                  'fixed left-1/2 top-[12vh] z-50 w-[calc(100%-2rem)] p-6 surface-glass rounded-2xl',
                  'max-h-[84vh] overflow-y-auto focus:outline-none',
                  SIZES[size]
                )}
                initial={{ opacity: 0, scale: 0.96, y: 8, x: '-50%' }}
                animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, scale: 0.98, y: 4, x: '-50%' }}
                transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <div className="flex items-start justify-between gap-4">
                  <DialogPrimitive.Title className="font-display text-lg font-semibold text-retro-dark">
                    {title}
                  </DialogPrimitive.Title>
                  {!hideClose && (
                    <DialogPrimitive.Close asChild>
                      <button
                        type="button"
                        aria-label="Close"
                        className="-mr-1 -mt-1 rounded-md p-1 text-retro-dark/40 transition-colors hover:bg-retro-dark/5 hover:text-retro-dark"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </DialogPrimitive.Close>
                  )}
                </div>
                <DialogPrimitive.Description
                  className={cn('mt-2 text-sm text-muted-foreground', !description && 'sr-only')}
                >
                  {description ?? title}
                </DialogPrimitive.Description>
                {children && <div className="mt-4">{children}</div>}
                {onConfirm && (
                  <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                      {cancelLabel}
                    </Button>
                    <Button
                      variant={variant === 'destructive' ? 'destructive' : 'default'}
                      onClick={onConfirm}
                    >
                      {confirmLabel}
                    </Button>
                  </div>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
