'use client'

import * as React from 'react'
import { cn } from '../utils'
import { ClockIcon } from '../icons'

export interface ETAProps {
  minutes:    number
  isLive?:    boolean
  label?:     string
  className?: string
}

export function ETA({ minutes, isLive = false, label = 'Livraison estimée', className }: ETAProps) {
  const [remaining, setRemaining] = React.useState(minutes)

  // Countdown when live
  React.useEffect(() => {
    if (!isLive) { setRemaining(minutes); return }
    const id = setInterval(() => {
      setRemaining((v) => Math.max(0, v - 1))
    }, 60_000)
    return () => clearInterval(id)
  }, [isLive, minutes])

  function formatETA(m: number): string {
    if (m <= 0) return 'Imminent'
    if (m < 60) return `${m} min`
    const h = Math.floor(m / 60)
    const r = m % 60
    return r ? `${h}h ${r}min` : `${h}h`
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-xl',
        'bg-[var(--bg-surface)] border border-[var(--border)]',
        className
      )}
      aria-live={isLive ? 'polite' : undefined}
      aria-label={`${label} : ${formatETA(remaining)}`}
    >
      {/* Live pulse dot */}
      {isLive && (
        <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand)] opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--brand)]" />
        </span>
      )}
      {!isLive && <ClockIcon size={14} className="text-[var(--brand)] shrink-0" />}

      <div className="flex flex-col">
        {label && (
          <span className="text-[10px] text-[var(--text-muted)] leading-none">{label}</span>
        )}
        <span className="text-sm font-bold text-[var(--text-primary)] leading-tight">
          {formatETA(remaining)}
        </span>
      </div>
    </div>
  )
}
