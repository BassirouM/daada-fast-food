import * as React from 'react'
import { cn } from '../utils'

export type SpinnerSize  = 'sm' | 'md' | 'lg'

export interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?:  SpinnerSize
  label?: string
}

const sizeMap: Record<SpinnerSize, number> = { sm: 16, md: 24, lg: 36 }

export function Spinner({ size = 'md', label = 'Chargement…', className, ...props }: SpinnerProps) {
  const px = sizeMap[size]
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      role="status"
      aria-label={label}
      className={cn('animate-spin text-[var(--brand)]', className)}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
