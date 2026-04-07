'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../utils'
import { XIcon } from '../icons'

export interface CartDrawerProps {
  isOpen:     boolean
  onClose:    () => void
  title?:     string
  children?:  React.ReactNode
  className?: string
}

export function CartDrawer({
  isOpen,
  onClose,
  title = 'Mon panier',
  children,
  className,
}: CartDrawerProps) {
  const [mounted, setMounted]   = React.useState(false)
  const [visible, setVisible]   = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])

  React.useEffect(() => {
    if (isOpen) {
      setVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      // Delay unmount for exit animation
      const t = setTimeout(() => setVisible(false), 300)
      return () => clearTimeout(t)
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Close on Escape
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!mounted || (!isOpen && !visible)) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer panel */}
      <div
        className={cn(
          'relative flex flex-col',
          'w-full max-w-[420px] h-full',
          'bg-[var(--bg-base)]',
          'shadow-[var(--shadow-lg)]',
          'transition-transform duration-300 ease-[cubic-bezier(0.34,1.1,0.64,1)]',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)] shrink-0">
          <h2 className="text-base font-bold text-[var(--text-primary)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le panier"
            className={cn(
              'w-9 h-9 flex items-center justify-center rounded-xl',
              'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
              'hover:bg-[var(--bg-elevated)]',
              'transition-colors duration-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]'
            )}
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
