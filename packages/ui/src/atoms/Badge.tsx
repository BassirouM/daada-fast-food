import * as React from 'react'
import { cn } from '../utils'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'premium'
export type BadgeSize    = 'sm' | 'md'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:  BadgeVariant
  size?:     BadgeSize
  dot?:      boolean
  children?: React.ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]',
  success:  'bg-[var(--success-subtle)] text-[var(--success)] border border-[rgba(34,197,94,0.2)]',
  warning:  'bg-[var(--warning-subtle)] text-[var(--warning)] border border-[rgba(245,158,11,0.2)]',
  danger:   'bg-[var(--danger-subtle)] text-[var(--danger)] border border-[rgba(239,68,68,0.2)]',
  info:     'bg-[var(--info-subtle)] text-[var(--info)] border border-[rgba(59,130,246,0.2)]',
  premium:  'bg-gradient-to-r from-amber-500/20 to-yellow-400/20 text-amber-400 border border-amber-500/30',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[var(--text-muted)]',
  success: 'bg-[var(--success)]',
  warning: 'bg-[var(--warning)]',
  danger:  'bg-[var(--danger)]',
  info:    'bg-[var(--info)]',
  premium: 'bg-amber-400',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2 py-1 gap-1.5',
}

export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden
          className={cn('shrink-0 rounded-full', dotColors[variant], size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')}
        />
      )}
      {children}
    </span>
  )
}
