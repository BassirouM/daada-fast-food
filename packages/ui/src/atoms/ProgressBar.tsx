import * as React from 'react'
import { cn } from '../utils'

export interface ProgressBarProps {
  value:      number
  max?:       number
  label?:     string
  color?:     'brand' | 'success' | 'warning' | 'danger' | 'info'
  animated?:  boolean
  className?: string
}

const colorMap: Record<NonNullable<ProgressBarProps['color']>, string> = {
  brand:   'bg-[var(--brand)]',
  success: 'bg-[var(--success)]',
  warning: 'bg-[var(--warning)]',
  danger:  'bg-[var(--danger)]',
  info:    'bg-[var(--info)]',
}

export function ProgressBar({
  value,
  max = 100,
  label,
  color = 'brand',
  animated = false,
  className,
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--text-secondary)]">{label}</span>
          <span className="font-semibold text-[var(--text-primary)]">
            {Math.round(percent)}%
          </span>
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="relative h-2 w-full rounded-full bg-[var(--bg-overlay)] overflow-hidden"
      >
        <div
          className={cn(
            'absolute left-0 top-0 h-full rounded-full',
            'transition-[width] duration-500 ease-out',
            colorMap[color],
            animated && 'animate-pulse'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
