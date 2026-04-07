'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../utils'
import { XIcon } from '../icons'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ModalProps {
  open:        boolean
  onClose:     () => void
  title?:      string
  description?: string
  size?:       'sm' | 'md' | 'lg' | 'xl' | 'full'
  hideClose?:  boolean
  children:    React.ReactNode
  footer?:     React.ReactNode
  className?:  string
}

// ---------------------------------------------------------------------------
// useModal hook
// ---------------------------------------------------------------------------

export interface UseModalReturn {
  open:    boolean
  onOpen:  () => void
  onClose: () => void
  toggle:  () => void
}

export function useModal(initialOpen = false): UseModalReturn {
  const [open, setOpen] = React.useState(initialOpen)
  return {
    open,
    onOpen:  () => setOpen(true),
    onClose: () => setOpen(false),
    toggle:  () => setOpen((v) => !v),
  }
}

// ---------------------------------------------------------------------------
// ModalContext + ModalProvider (for imperative API)
// ---------------------------------------------------------------------------

interface ModalState {
  props: Omit<ModalProps, 'open' | 'onClose'> | null
  open:  boolean
}

interface ModalContextValue {
  showModal: (props: Omit<ModalProps, 'open' | 'onClose'>) => void
  closeModal: () => void
}

const ModalContext = React.createContext<ModalContextValue | null>(null)

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ModalState>({ props: null, open: false })

  const showModal = React.useCallback((props: Omit<ModalProps, 'open' | 'onClose'>) => {
    setState({ props, open: true })
  }, [])

  const closeModal = React.useCallback(() => {
    setState((prev) => ({ ...prev, open: false }))
  }, [])

  return (
    <ModalContext.Provider value={{ showModal, closeModal }}>
      {children}
      {state.props && (
        <Modal open={state.open} onClose={closeModal} {...state.props} />
      )}
    </ModalContext.Provider>
  )
}

export function useModalContext(): ModalContextValue {
  const ctx = React.useContext(ModalContext)
  if (!ctx) throw new Error('useModalContext must be used inside <ModalProvider>')
  return ctx
}

// ---------------------------------------------------------------------------
// SIZE MAP
// ---------------------------------------------------------------------------

const SIZE_MAP: Record<NonNullable<ModalProps['size']>, string> = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-xl',
  full: 'max-w-full mx-4',
}

// ---------------------------------------------------------------------------
// Modal component
// ---------------------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  hideClose = false,
  children,
  footer,
  className,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Body overflow lock
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Escape key
  React.useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Focus trap — move focus inside on open
  const panelRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (open) {
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()
    }
  }, [open])

  if (!mounted || !open) return null

  const titleId = title ? 'modal-title' : undefined
  const descId  = description ? 'modal-desc' : undefined

  return createPortal(
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        aria-hidden
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'relative w-full flex flex-col',
          'bg-[var(--bg-base)] border border-[var(--border)]',
          'rounded-2xl shadow-[var(--shadow-lg)]',
          'animate-scale-in',
          'max-h-[90dvh]',
          SIZE_MAP[size],
          className
        )}
      >
        {/* Header */}
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 shrink-0">
            <div className="flex-1 min-w-0">
              {title && (
                <h2
                  id={titleId}
                  className="text-base font-semibold text-[var(--text-primary)] leading-snug"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id={descId}
                  className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed"
                >
                  {description}
                </p>
              )}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer la modale"
                className={cn(
                  'shrink-0 w-8 h-8 flex items-center justify-center rounded-xl',
                  'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                  'hover:bg-[var(--bg-elevated)]',
                  'transition-colors duration-100',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]'
                )}
              >
                <XIcon size={16} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 px-5 pb-5 pt-3 border-t border-[var(--border)]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
