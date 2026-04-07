import * as React from 'react'
import { cn } from '../utils'
import { OrderStatusBadge, type OrderStatus } from '../molecules/OrderStatusBadge'
import { PriceDisplay } from '../atoms/PriceDisplay'
import { ClockIcon, ChevronRightIcon } from '../icons'

export interface OrderCardItem {
  name:     string
  quantity: number
}

export interface OrderCardData {
  id:          string
  status:      OrderStatus
  createdAt:   string
  total:       number
  items:       OrderCardItem[]
  itemCount:   number
}

export interface OrderCardProps {
  order:      OrderCardData
  onView?:    (id: string) => void
  onReorder?: (id: string) => void
  className?: string
}

export function OrderCard({ order, onView, onReorder, className }: OrderCardProps) {
  const itemsLabel = order.items
    .slice(0, 2)
    .map((i) => `${i.quantity}× ${i.name}`)
    .join(', ')
  const overflow = order.itemCount - 2

  return (
    <article
      className={cn(
        'flex flex-col gap-3 p-4 rounded-2xl',
        'bg-[var(--bg-surface)] border border-[var(--border)]',
        'transition-all duration-150',
        onView && 'cursor-pointer hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]',
        className
      )}
      onClick={() => onView?.(order.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-mono text-[var(--text-muted)]">#{order.id.slice(0, 8).toUpperCase()}</p>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[var(--text-muted)]">
            <ClockIcon size={11} />
            <time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>
          </div>
        </div>
        <OrderStatusBadge status={order.status} size="sm" />
      </div>

      {/* Items */}
      <p className="text-sm text-[var(--text-secondary)] leading-snug">
        {itemsLabel}
        {overflow > 0 && (
          <span className="text-[var(--text-muted)]"> et {overflow} autre{overflow > 1 ? 's' : ''}</span>
        )}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <PriceDisplay amount={order.total} size="md" />
        <div className="flex items-center gap-2">
          {onReorder && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onReorder(order.id) }}
              aria-label="Recommander"
              className={cn(
                'h-8 px-3 rounded-xl text-xs font-medium',
                'bg-[var(--brand-subtle)] text-[var(--brand)]',
                'hover:bg-[var(--brand)] hover:text-white',
                'transition-colors duration-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]'
              )}
            >
              Recommander
            </button>
          )}
          {onView && (
            <span className="text-[var(--text-muted)]" aria-hidden>
              <ChevronRightIcon size={16} />
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
