'use client'

import * as React from 'react'
import { cn } from '../utils'
import { CheckCircleIcon, XIcon } from '../icons'
import { Spinner } from '../atoms/Spinner'

export interface CouponInputProps {
  onApply:    (code: string) => Promise<{ success: boolean; message: string }>
  appliedCode?: string | null
  onRemove?:  () => void
  className?: string
}

export function CouponInput({
  onApply,
  appliedCode,
  onRemove,
  className,
}: CouponInputProps) {
  const [code, setCode] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ success: boolean; message: string } | null>(null)
  const inputId = React.useId()

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setLoading(true)
    setFeedback(null)
    try {
      const result = await onApply(trimmed)
      setFeedback(result)
      if (result.success) setCode('')
    } finally {
      setLoading(false)
    }
  }

  // Coupon already applied
  if (appliedCode) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2.5 rounded-xl',
          'bg-[var(--success-subtle)] border border-[rgba(34,197,94,0.25)]',
          className
        )}
      >
        <CheckCircleIcon size={16} className="text-[var(--success)] shrink-0" />
        <span className="flex-1 text-sm font-semibold text-[var(--success)] tracking-wide">
          {appliedCode}
        </span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Retirer le coupon"
            className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center',
              'text-[var(--success)] hover:bg-[var(--success)] hover:text-white',
              'transition-colors duration-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--success)]'
            )}
          >
            <XIcon size={10} />
          </button>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleApply} className={cn('flex flex-col gap-2', className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <label htmlFor={inputId} className="sr-only">Code promo</label>
          <input
            id={inputId}
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setFeedback(null) }}
            placeholder="CODE PROMO"
            maxLength={20}
            aria-describedby={feedback ? `${inputId}-feedback` : undefined}
            className={cn(
              'w-full h-11 px-4 rounded-xl',
              'bg-[var(--bg-input)] text-[var(--text-primary)] text-sm font-mono tracking-widest',
              'border placeholder:text-[var(--text-muted)] placeholder:tracking-normal placeholder:font-sans',
              'transition-[border-color,box-shadow] duration-[120ms]',
              'focus:outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-glow)]',
              feedback?.success === false ? 'border-[var(--danger)]' : 'border-[var(--border)]'
            )}
          />
        </div>
        <button
          type="submit"
          disabled={!code.trim() || loading}
          className={cn(
            'h-11 px-5 rounded-xl text-sm font-semibold shrink-0',
            'bg-[var(--brand)] text-white',
            'hover:bg-[var(--brand-light)]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'transition-all duration-[120ms]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]',
            'flex items-center gap-2'
          )}
        >
          {loading && <Spinner size="sm" className="text-white" />}
          Appliquer
        </button>
      </div>

      {feedback && (
        <p
          id={`${inputId}-feedback`}
          role="alert"
          className={cn(
            'text-xs',
            feedback.success ? 'text-[var(--success)]' : 'text-[var(--danger)]'
          )}
        >
          {feedback.message}
        </p>
      )}
    </form>
  )
}
