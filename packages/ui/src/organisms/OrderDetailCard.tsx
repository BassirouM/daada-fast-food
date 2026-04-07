import * as React from 'react'
import { cn } from '../utils'
import { OrderStatusBadge, OrderStatusTimeline, type OrderStatus, type StatusHistoryEntry } from '../molecules/OrderStatusBadge'
import { PriceDisplay } from '../atoms/PriceDisplay'
import { Divider } from '../atoms/Divider'
import { ETA } from '../molecules/ETA'
import { ClockIcon, MapPinIcon, TruckIcon } from '../icons'

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA'
}

export interface OrderDetailItem {
  name:      string
  quantity:  number
  unitPrice: number
  subtotal:  number
  options?:  string
}

export interface OrderDetailData {
  id:              string
  status:          OrderStatus
  createdAt:       string
  items:           OrderDetailItem[]
  subtotal:        number
  deliveryFee:     number
  discount?:       number
  total:           number
  paymentMethod?:  string
  deliveryAddress?: string
  estimatedMinutes?: number
}

export interface OrderDetailCardProps {
  order:          OrderDetailData
  statusHistory:  StatusHistoryEntry[]
  className?:     string
}

const paymentLabels: Record<string, string> = {
  mtn:    'MTN Mobile Money',
  orange: 'Orange Money',
  cash:   'Paiement cash',
}

export function OrderDetailCard({ order, statusHistory, className }: OrderDetailCardProps) {
  const isLive = order.status === 'delivering'

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-mono text-[var(--text-muted)]">
            Commande #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[var(--text-muted)]">
            <ClockIcon size={11} />
            <time dateTime={order.createdAt}>
              {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                weekday: 'long', day: '2-digit', month: 'long',
                hour: '2-digit', minute: '2-digit'
              })}
            </time>
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* ETA for live delivery */}
      {order.estimatedMinutes && (order.status === 'delivering' || order.status === 'preparing') && (
        <ETA minutes={order.estimatedMinutes} isLive={isLive} label="Livraison estimée" />
      )}

      {/* Status timeline */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Suivi de commande</h3>
        <OrderStatusTimeline history={statusHistory} />
      </div>

      {/* Items */}
      <div className="flex flex-col rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] px-4 pt-4 pb-2">
          Articles ({order.items.length})
        </h3>
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-t border-[var(--border)] first:border-t-0">
            <span className="text-sm font-semibold text-[var(--brand)] shrink-0 w-5">
              {item.quantity}×
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text-primary)] truncate">{item.name}</p>
              {item.options && (
                <p className="text-xs text-[var(--text-muted)] truncate">{item.options}</p>
              )}
            </div>
            <span className="text-sm font-medium text-[var(--text-primary)] shrink-0">
              {formatFCFA(item.subtotal)}
            </span>
          </div>
        ))}

        {/* Price breakdown */}
        <div className="px-4 pt-3 pb-4 border-t border-[var(--border)] flex flex-col gap-1.5">
          <div className="flex justify-between text-sm text-[var(--text-muted)]">
            <span>Sous-total</span><span>{formatFCFA(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-[var(--text-muted)]">
            <span>Livraison</span><span>{formatFCFA(order.deliveryFee)}</span>
          </div>
          {order.discount && order.discount > 0 && (
            <div className="flex justify-between text-sm text-[var(--success)]">
              <span>Réduction</span><span>-{formatFCFA(order.discount)}</span>
            </div>
          )}
          <Divider className="my-1" />
          <div className="flex justify-between">
            <span className="text-sm font-bold text-[var(--text-primary)]">Total</span>
            <span className="text-base font-bold text-[var(--brand)]">{formatFCFA(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Delivery + payment info */}
      <div className="grid grid-cols-2 gap-3">
        {order.deliveryAddress && (
          <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
            <div className="flex items-center gap-1.5 mb-1">
              <MapPinIcon size={13} className="text-[var(--brand)]" />
              <span className="text-xs font-semibold text-[var(--text-muted)]">Adresse</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-snug">{order.deliveryAddress}</p>
          </div>
        )}
        {order.paymentMethod && (
          <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
            <div className="flex items-center gap-1.5 mb-1">
              <TruckIcon size={13} className="text-[var(--brand)]" />
              <span className="text-xs font-semibold text-[var(--text-muted)]">Paiement</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {paymentLabels[order.paymentMethod] ?? order.paymentMethod}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
