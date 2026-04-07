import * as React from 'react'
import { cn } from '../utils'

export type ChangeType = 'up' | 'down' | 'neutral'

export interface KPICardProps {
  title:       string
  value:       string | number
  change?:     string
  changeType?: ChangeType
  icon?:       React.ReactNode
  className?:  string
}

export function KPICard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  className,
}: KPICardProps) {
  const changeColors: Record<ChangeType, string> = {
    up:      'text-[var(--success)] bg-[var(--success-subtle)]',
    down:    'text-[var(--danger)] bg-[var(--danger-subtle)]',
    neutral: 'text-[var(--text-muted)] bg-[var(--bg-overlay)]',
  }

  const changeArrow: Record<ChangeType, string> = {
    up:      '↑ ',
    down:    '↓ ',
    neutral: '',
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 p-4 rounded-2xl',
        'bg-[var(--bg-surface)] border border-[var(--border)]',
        'transition-transform duration-150 hover:scale-[1.01]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
          {title}
        </span>
        {icon && (
          <span className="text-[var(--brand)]" aria-hidden>
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <p
        className="text-2xl font-bold text-[var(--text-primary)] leading-none"
        aria-label={`${title} : ${value}`}
      >
        {value}
      </p>

      {/* Change badge */}
      {change && (
        <span
          className={cn(
            'self-start text-xs font-semibold px-2 py-0.5 rounded-full',
            changeColors[changeType]
          )}
          aria-label={`Variation : ${changeArrow[changeType]}${change}`}
        >
          {changeArrow[changeType]}{change}
        </span>
      )}
    </div>
  )
}
