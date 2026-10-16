'use client'

import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  variant?: 'default' | 'destructive'
  className?: string
}
const dialogStack: HTMLElement[] = []
const focusSelector =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Modal with focus containment, Escape dismissal, scroll locking and trigger focus restoration. */
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
  className,
}: DialogProps) {
  const id = useId()
  const panel = useRef<HTMLDivElement>(null)
  const returnTarget = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(false)
  const close = useRef(onClose)
  close.current = onClose
  if (open && !wasOpen.current && typeof document !== 'undefined')
    returnTarget.current = document.activeElement as HTMLElement
  wasOpen.current = open

  useEffect(() => {
    const element = panel.current
    if (!open || !element) return
    dialogStack.push(element)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusable = () =>
      [...element.querySelectorAll<HTMLElement>(focusSelector)].filter(
        (item) =>
          !item.closest('[hidden]') &&
          getComputedStyle(item).display !== 'none' &&
          getComputedStyle(item).visibility !== 'hidden'
      )
    if (!element.contains(document.activeElement))
      (element.querySelector<HTMLElement>('[autofocus]') ?? focusable()[0] ?? element).focus()
    const keydown = (event: KeyboardEvent) => {
      if (dialogStack.at(-1) !== element) return
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopImmediatePropagation()
        close.current()
      }
      if (event.key !== 'Tab') return
      const controls = focusable()
      const first = controls[0] ?? element
      const last = controls.at(-1) ?? element
      if (
        event.shiftKey &&
        (document.activeElement === first || !element.contains(document.activeElement))
      ) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !element.contains(document.activeElement))
      ) {
        event.preventDefault()
        first.focus()
      }
    }
    const focusin = (event: FocusEvent) => {
      if (dialogStack.at(-1) === element && !element.contains(event.target as Node))
        (focusable()[0] ?? element).focus()
    }
    document.addEventListener('keydown', keydown)
    document.addEventListener('focusin', focusin)
    return () => {
      dialogStack.splice(dialogStack.indexOf(element), 1)
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', keydown)
      document.removeEventListener('focusin', focusin)
      if (returnTarget.current?.isConnected) returnTarget.current.focus()
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm motion-fade"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-description` : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-3xl border bg-popover p-5 text-popover-foreground shadow-soft-lg outline-none motion-panel sm:p-7',
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={`${id}-title`} className="font-display text-xl font-semibold tracking-tight">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 -mt-2 shrink-0"
            aria-label={`Close ${title}`}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {description && (
          <p
            id={`${id}-description`}
            className="mt-2 text-sm leading-relaxed text-muted-foreground"
          >
            {description}
          </p>
        )}
        {children && <div className="mt-5">{children}</div>}
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
      </div>
    </div>,
    document.body
  )
}
