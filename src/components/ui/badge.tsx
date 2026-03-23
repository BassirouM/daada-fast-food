import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5',
    'text-xs font-semibold leading-none',
    'border border-transparent',
    'whitespace-nowrap',
  ],
  {
    variants: {
      variant: {
        default:   'bg-[var(--brand)] text-white',
        outline:   'bg-transparent border-[var(--brand)] text-[var(--brand)]',
        secondary: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)]',
        success:   'bg-[var(--success-subtle)] text-[var(--success)]',
        warning:   'bg-[var(--warning-subtle)] text-[var(--warning)]',
        danger:    'bg-[var(--danger-subtle)] text-[var(--danger)]',
        info:      'bg-[var(--info-subtle)] text-[var(--info)]',
        // Order statuses
        pending:   'bg-[var(--warning-subtle)] text-[var(--warning)]',
        confirmed: 'bg-[var(--info-subtle)] text-[var(--info)]',
        preparing: 'bg-[rgba(251,146,60,0.15)] text-[#FB923C]',
        ready:     'bg-[var(--success-subtle)] text-[var(--success)]',
        picked_up: 'bg-[rgba(168,85,247,0.15)] text-[#A855F7]',
        delivered: 'bg-[var(--success-subtle)] text-[var(--success)]',
        cancelled: 'bg-[var(--danger-subtle)] text-[var(--danger)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      )}
      {children}
    </span>
  )
}

export { Badge, badgeVariants }
