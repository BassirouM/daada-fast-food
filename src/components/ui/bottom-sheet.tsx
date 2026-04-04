'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  /** Height preset or custom CSS value */
  height?: 'auto' | 'half' | 'full' | string
  /** Show drag handle */
  handle?: boolean
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
  height = 'auto',
  handle = true,
}: BottomSheetProps) {
  const sheetRef = React.useRef<HTMLDivElement>(null)

  // Lock body scroll
  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Touch drag-to-dismiss
  const dragStartY = React.useRef(0)
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0]?.clientY ?? 0
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dy = (e.changedTouches[0]?.clientY ?? 0) - dragStartY.current
    if (dy > 80) onClose()
  }

  // Height class
  const heightStyle: React.CSSProperties =
    height === 'auto'
      ? { maxHeight: '90dvh' }
      : height === 'half'
      ? { height: '50dvh' }
      : height === 'full'
      ? { height: '100dvh' }
      : { height }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'sheet-title' : undefined}
      className="fixed inset-0 z-[900] flex flex-col justify-end"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={heightStyle}
        className={cn(
          'relative w-full',
          'bg-[var(--bg-surface)] border-t border-[var(--border)]',
          'rounded-t-3xl',
          'shadow-[0_-8px_40px_rgba(0,0,0,0.4)]',
          'flex flex-col',
          'animate-slide-up',
          'overflow-hidden',
          className
        )}
      >
        {/* Drag handle */}
        {handle && (
          <div
            className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
            aria-hidden="true"
          >
            <div className="h-1 w-10 rounded-full bg-[var(--border-strong)]" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
            <h2 id="sheet-title" className="text-base font-semibold text-[var(--text-primary)]">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-safe">
          {children}
        </div>
      </div>
    </div>
  )
}
