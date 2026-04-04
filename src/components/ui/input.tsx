import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, hint, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const hasError = Boolean(error)

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text-primary)]"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-[var(--text-muted)] pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              // Base
              'w-full h-12 rounded-xl px-4',
              'bg-[var(--bg-input)] text-[var(--text-primary)]',
              'border border-[var(--border)]',
              'text-base placeholder:text-[var(--text-muted)]',
              // Focus — orange glow
              'transition-[border-color,box-shadow] duration-[120ms]',
              'focus:outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-glow)]',
              // Error
              hasError && 'border-[var(--danger)] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]',
              // Icons padding
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              // Disabled
              'disabled:opacity-50 disabled:cursor-not-allowed',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 text-[var(--text-muted)]">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs text-[var(--danger)]" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-[var(--text-muted)]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
