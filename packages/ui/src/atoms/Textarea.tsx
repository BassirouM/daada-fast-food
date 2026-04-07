'use client'

import * as React from 'react'
import { cn } from '../utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:     string
  error?:     string
  hint?:      string
  maxLength?: number
  rows?:      number
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, maxLength, rows = 4, id, value, ...props }, ref) => {
    const generatedId = React.useId()
    const textareaId = id ?? generatedId
    const hasError = Boolean(error)

    const charCount = typeof value === 'string' ? value.length : undefined

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-[var(--text-primary)] select-none"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <textarea
            id={textareaId}
            ref={ref}
            rows={rows}
            maxLength={maxLength}
            value={value}
            className={cn(
              'w-full rounded-xl px-4 py-3',
              'bg-[var(--bg-input)] text-[var(--text-primary)] text-sm',
              'border',
              'placeholder:text-[var(--text-muted)]',
              'transition-[border-color,box-shadow] duration-[120ms]',
              'focus:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'resize-none',
              maxLength && 'pb-7',
              !hasError && [
                'border-[var(--border)]',
                'focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-glow)]',
              ],
              hasError && [
                'border-[var(--danger)]',
                'focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]',
              ],
              className
            )}
            aria-invalid={hasError || undefined}
            aria-describedby={
              [error && `${textareaId}-error`, hint && `${textareaId}-hint`]
                .filter(Boolean)
                .join(' ') || undefined
            }
            {...props}
          />

          {/* Character counter */}
          {maxLength && charCount !== undefined && (
            <span
              className={cn(
                'absolute bottom-2.5 right-3 text-xs pointer-events-none',
                charCount >= maxLength
                  ? 'text-[var(--danger)]'
                  : charCount >= maxLength * 0.8
                  ? 'text-[var(--warning)]'
                  : 'text-[var(--text-muted)]'
              )}
              aria-live="polite"
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>

        {error && (
          <p id={`${textareaId}-error`} className="text-xs text-[var(--danger)]" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${textareaId}-hint`} className="text-xs text-[var(--text-muted)]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
