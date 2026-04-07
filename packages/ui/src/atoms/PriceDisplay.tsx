import * as React from 'react'
import { cn } from '../utils'

export type PriceDisplaySize = 'sm' | 'md' | 'lg'

export interface PriceDisplayProps {
  amount:        number
  comparePrice?: number   // Original price (shows crossed out)
  currency?:     string
  size?:         PriceDisplaySize
  className?:    string
}

const sizeMap: Record<PriceDisplaySize, { price: string; compare: string; badge: string }> = {
  sm: { price: 'text-sm font-semibold', compare: 'text-xs', badge: 'text-[10px] px-1' },
  md: { price: 'text-base font-bold',   compare: 'text-sm', badge: 'text-xs px-1.5'   },
  lg: { price: 'text-xl font-bold',     compare: 'text-sm', badge: 'text-xs px-1.5'   },
}

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount))
}

function discountPercent(original: number, discounted: number): number {
  return Math.round(((original - discounted) / original) * 100)
}

export function PriceDisplay({
  amount,
  comparePrice,
  currency = 'FCFA',
  size = 'md',
  className,
}: PriceDisplayProps) {
  const { price, compare, badge } = sizeMap[size]
  const hasDiscount = comparePrice !== undefined && comparePrice > amount
  const pct = hasDiscount ? discountPercent(comparePrice!, amount) : 0

  return (
    <div className={cn('flex items-baseline gap-2 flex-wrap', className)}>
      <span className={cn('text-[var(--brand)]', price)}>
        {formatFCFA(amount)}{' '}
        <span className="font-normal text-[0.75em] opacity-80">{currency}</span>
      </span>

      {hasDiscount && (
        <>
          <span
            className={cn('text-[var(--text-muted)] line-through', compare)}
            aria-label={`Prix original : ${formatFCFA(comparePrice!)} ${currency}`}
          >
            {formatFCFA(comparePrice!)}
          </span>
          <span
            className={cn(
              'rounded-full bg-[var(--danger-subtle)] text-[var(--danger)]',
              'font-semibold leading-none py-0.5',
              badge
            )}
            aria-label={`${pct}% de réduction`}
          >
            -{pct}%
          </span>
        </>
      )}
    </div>
  )
}
