import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  [
    'rounded-2xl border',
    'transition-all duration-[200ms] ease-out',
    'overflow-hidden',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[var(--bg-surface)] border-[var(--border)]',
          'shadow-[var(--shadow-sm)]',
        ],
        glass: [
          'bg-[var(--glass-bg)] border-[var(--glass-border)]',
          'backdrop-blur-[16px]',
          'shadow-[var(--shadow-md)]',
        ],
        elevated: [
          'bg-[var(--bg-elevated)] border-[var(--border)]',
          'shadow-[var(--shadow-md)]',
        ],
        brand: [
          'bg-[var(--brand-subtle)] border-[var(--border-brand)]',
        ],
      },
      hoverable: {
        true: [
          'cursor-pointer',
          'hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]',
          'active:translate-y-0 active:shadow-[var(--shadow-sm)]',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hoverable, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant, hoverable, className }))} {...props} />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 pb-0 flex flex-col gap-1', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-base font-semibold leading-tight text-[var(--text-primary)]', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-[var(--text-secondary)]', className)} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 pt-0 flex items-center gap-2', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants }
