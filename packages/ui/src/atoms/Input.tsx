'use client'

import * as React from 'react'
import { cn } from '../utils'

export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:      string
  hint?:       string
  error?:      string
  success?:    string
  leftIcon?:   React.ReactNode
  rightIcon?:  React.ReactNode
  inputSize?:  InputSize
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'h-9 text-xs px-3',
  md: 'h-11 text-sm px-4',
  lg: 'h-13 text-base px-5',
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      hint,
      error,
      success,
      leftIcon,
      rightIcon,
      inputSize = 'md',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const hasError   = Boolean(error)
    const hasSuccess = Boolean(success)

    const describedBy = [
      error   ? `${inputId}-error`   : null,
      success ? `${inputId}-success` : null,
      hint    ? `${inputId}-hint`    : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text-primary)] select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className="absolute left-3 text-[var(--text-muted)] pointer-events-none"
              aria-hidden
            >
              {leftIcon}
            </span>
          )}

          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              'w-full rounded-xl',
              'bg-[var(--bg-input)] text-[var(--text-primary)]',
              'border',
              'placeholder:text-[var(--text-muted)]',
              'transition-[border-color,box-shadow] duration-[120ms]',
              'focus:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              // Default border + focus
              !hasError && !hasSuccess && [
                'border-[var(--border)]',
                'focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-glow)]',
              ],
              // Error state
              hasError && [
                'border-[var(--danger)]',
                'focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]',
              ],
              // Success state
              hasSuccess && [
                'border-[var(--success)]',
                'focus:shadow-[0_0_0_3px_rgba(34,197,94,0.2)]',
              ],
              sizeClasses[inputSize],
              leftIcon  && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
            {...props}
          />

          {rightIcon && (
            <span
              className="absolute right-3 text-[var(--text-muted)]"
              aria-hidden
            >
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs text-[var(--danger)]" role="alert">
            {error}
          </p>
        )}
        {success && !error && (
          <p id={`${inputId}-success`} className="text-xs text-[var(--success)]">
            {success}
          </p>
        )}
        {hint && !error && !success && (
          <p id={`${inputId}-hint`} className="text-xs text-[var(--text-muted)]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
