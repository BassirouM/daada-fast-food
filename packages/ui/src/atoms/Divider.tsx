import * as React from 'react'
import { cn } from '../utils'

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  label?:       string
  className?:   string
}

export function Divider({ orientation = 'horizontal', label, className }: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn('w-px self-stretch bg-[var(--border)]', className)}
      />
    )
  }

  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)} role="separator">
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-xs text-[var(--text-muted)] shrink-0">{label}</span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>
    )
  }

  return (
    <hr
      role="separator"
      className={cn('border-0 h-px bg-[var(--border)]', className)}
    />
  )
}
