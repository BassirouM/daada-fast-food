import * as React from 'react'
import { cn } from '@/lib/utils'

interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const sizeMap = {
  xs: 'h-3 w-3 border',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
}

const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size = 'md', ...props }, ref) => (
    <span
      ref={ref}
      role="status"
      aria-label="Chargement..."
      className={cn(
        'inline-block rounded-full border-current border-r-transparent animate-spin',
        sizeMap[size],
        className
      )}
      {...props}
    />
  )
)
Spinner.displayName = 'Spinner'

export { Spinner }
