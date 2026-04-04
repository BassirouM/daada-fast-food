'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  /** Prevent closing on backdrop click */
  persistent?: boolean
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  persistent = false,
}: ModalProps) {
  // Lock body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Keyboard ESC
  React.useEffect(() => {
    if (!open || persistent) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, persistent, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-desc' : undefined}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
    >
      {/* Backdrop — blur + fade */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={persistent ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Panel — scale in */}
      <div
        className={cn(
          'relative w-full max-w-md',
          'bg-[var(--bg-surface)] border border-[var(--border)]',
          'rounded-2xl shadow-[var(--shadow-lg)]',
          'animate-scale-in',
          'max-h-[90dvh] overflow-y-auto',
          className
        )}
      >
        {/* Header */}
        {(title ?? description) && (
          <div className="flex items-start justify-between gap-4 p-5 pb-4 border-b border-[var(--border)]">
            <div>
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold text-[var(--text-primary)]">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-desc" className="text-sm text-[var(--text-secondary)] mt-1">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ModalFooter({ className, ...props }: ModalFooterProps) {
  return (
    <div
      className={cn('flex items-center gap-3 justify-end pt-4 border-t border-[var(--border)] mt-4', className)}
      {...props}
    />
  )
}
