'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Spinner } from './spinner'

const buttonVariants = cva(
  // Base — shared across all variants
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-medium text-sm leading-none',
    'rounded-xl border border-transparent',
    'transition-all duration-[120ms] ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]',
    'disabled:pointer-events-none disabled:opacity-40',
    'active:scale-[0.97]',
    '-webkit-tap-highlight-color: transparent',
    'select-none',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-[var(--brand)] text-white',
          'hover:bg-[var(--brand-light)]',
          'shadow-[var(--shadow-brand)]',
          'hover:shadow-[0_6px_24px_rgba(249,115,22,0.4)]',
        ],
        secondary: [
          'bg-[var(--bg-elevated)] text-[var(--text-primary)]',
          'border-[var(--border)]',
          'hover:bg-[var(--bg-overlay)] hover:border-[var(--border-strong)]',
        ],
        ghost: [
          'bg-transparent text-[var(--text-secondary)]',
          'hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
        ],
        outline: [
          'bg-transparent text-[var(--brand)]',
          'border-[var(--brand)]',
          'hover:bg-[var(--brand-subtle)]',
        ],
        danger: [
          'bg-[var(--danger-subtle)] text-[var(--danger)]',
          'border-[rgba(239,68,68,0.25)]',
          'hover:bg-[var(--danger)] hover:text-white',
        ],
        link: [
          'bg-transparent text-[var(--brand)] underline-offset-4',
          'hover:underline',
          'h-auto p-0 rounded-none',
        ],
      },
      size: {
        sm: 'h-9 px-3 text-xs rounded-lg',
        md: 'h-11 px-5',
        lg: 'h-13 px-7 text-base rounded-2xl',
        xl: 'h-15 px-8 text-lg rounded-2xl',
        icon: 'h-10 w-10 rounded-xl p-0',
        'icon-sm': 'h-8 w-8 rounded-lg p-0',
        'icon-lg': 'h-12 w-12 rounded-2xl p-0',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    const isDisabled = disabled ?? loading

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" className="text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
