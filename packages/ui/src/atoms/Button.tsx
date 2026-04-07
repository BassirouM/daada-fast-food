'use client'

import * as React from 'react'
import { cn } from '../utils'
import { LoaderIcon } from '../icons'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link' | 'outline'
export type ButtonSize    = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant
  size?:      ButtonSize
  loading?:   boolean
  fullWidth?: boolean
  leftIcon?:  React.ReactNode
  rightIcon?: React.ReactNode
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-[var(--brand)] text-white',
    'hover:bg-[var(--brand-light)]',
    'shadow-[var(--shadow-brand)]',
    'hover:shadow-[0_6px_24px_rgba(255,107,0,0.4)]',
  ].join(' '),
  secondary: [
    'bg-[var(--bg-elevated)] text-[var(--text-primary)]',
    'border border-[var(--border)]',
    'hover:bg-[var(--bg-overlay)] hover:border-[var(--border-strong)]',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--text-secondary)]',
    'hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
  ].join(' '),
  outline: [
    'bg-transparent text-[var(--brand)]',
    'border border-[var(--brand)]',
    'hover:bg-[var(--brand-subtle)]',
  ].join(' '),
  danger: [
    'bg-[var(--danger-subtle)] text-[var(--danger)]',
    'border border-[rgba(239,68,68,0.25)]',
    'hover:bg-[var(--danger)] hover:text-white',
  ].join(' '),
  link: [
    'bg-transparent text-[var(--brand)]',
    'underline-offset-4 hover:underline',
    'h-auto! p-0! rounded-none shadow-none',
  ].join(' '),
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs rounded-xl gap-1.5',
  md: 'h-11 px-5 text-sm rounded-xl gap-2',
  lg: 'h-13 px-7 text-base rounded-2xl gap-2',
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          // Base
          'inline-flex items-center justify-center whitespace-nowrap',
          'font-medium leading-none',
          'border border-transparent',
          'transition-all duration-[120ms] ease-out',
          // Focus
          'focus-visible:outline-none',
          'focus-visible:ring-2 focus-visible:ring-[var(--brand)]',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]',
          // Disabled
          'disabled:pointer-events-none disabled:opacity-40',
          // Active scale
          'active:scale-[0.97]',
          // Select none
          'select-none',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <LoaderIcon size={size === 'sm' ? 14 : 16} className="shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0" aria-hidden>{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="shrink-0" aria-hidden>{rightIcon}</span>
        )}
      </button>
    )
  }
)
Button.displayName = 'Button'
