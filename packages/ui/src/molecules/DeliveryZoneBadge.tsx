import * as React from 'react'
import { cn } from '../utils'
import { TruckIcon, MapPinIcon } from '../icons'

export interface DeliveryZoneBadgeProps {
  zone:       string
  fee:        number
  className?: string
  compact?:   boolean
}

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

export function DeliveryZoneBadge({ zone, fee, className, compact = false }: DeliveryZoneBadgeProps) {
  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs',
          'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]',
          className
        )}
      >
        <TruckIcon size={11} />
        {formatFCFA(fee)}
      </span>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-2.5 rounded-xl',
        'bg-[var(--bg-surface)] border border-[var(--border)]',
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <MapPinIcon size={14} className="text-[var(--brand)]" />
        <span>{zone}</span>
      </div>
      <span className="text-sm font-semibold text-[var(--text-primary)]">
        {fee === 0 ? (
          <span className="text-[var(--success)]">Gratuit</span>
        ) : (
          formatFCFA(fee)
        )}
      </span>
    </div>
  )
}
