'use client'

import * as React from 'react'
import { cva } from 'class-variance-authority'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const toastVariants = cva(
  [
    'flex items-start gap-3 w-full max-w-sm',
    'rounded-2xl p-4 shadow-[var(--shadow-lg)]',
    'border',
    'animate-slide-right',
    'pointer-events-auto',
  ],
  {
    variants: {
      variant: {
        default: 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)]',
        success: 'bg-[var(--success-subtle)] border-[rgba(34,197,94,0.2)] text-[var(--success)]',
        error:   'bg-[var(--danger-subtle)]  border-[rgba(239,68,68,0.2)]  text-[var(--danger)]',
        warning: 'bg-[var(--warning-subtle)] border-[rgba(245,158,11,0.2)] text-[var(--warning)]',
        info:    'bg-[var(--info-subtle)]    border-[rgba(59,130,246,0.2)]  text-[var(--info)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

const iconMap = {
  default: Info,
  success: CheckCircle,
  error:   AlertCircle,
  warning: AlertTriangle,
  info:    Info,
}

export interface ToastData {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastItemProps extends ToastData {
  onDismiss: (id: string) => void
}

function ToastItem({ id, title, description, variant = 'default', onDismiss }: ToastItemProps) {
  const Icon = iconMap[variant]

  React.useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 4000)
    return () => clearTimeout(timer)
  }, [id, onDismiss])

  return (
    <div className={cn(toastVariants({ variant }))}>
      <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">{title}</p>
        {description && (
          <p className="text-xs mt-0.5 opacity-80 leading-snug">{description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

/* ─── Context & Provider ───────────────────────────────────────────────── */

type ToastContextType = {
  toast: (data: Omit<ToastData, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([])

  const toast = React.useCallback((data: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev.slice(-4), { ...data, id }])
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast viewport — fixed bottom-right on desktop, bottom on mobile */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 left-4 sm:left-auto z-[9999] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}
