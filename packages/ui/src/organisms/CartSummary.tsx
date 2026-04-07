'use client'

import * as React from 'react'
import { cn } from '../utils'
import { Button } from '../atoms/Button'
import { Divider } from '../atoms/Divider'
import { CouponInput } from '../molecules/CouponInput'

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA'
}

export interface CartSummaryProps {
  subtotal:                number
  deliveryFee:             number
  discount?:               number
  loyaltyDiscount?:        number
  total:                   number
  couponCode?:             string | null
  loyaltyPointsAvailable?: number
  onApplyCoupon?:          (code: string) => Promise<{ success: boolean; message: string }>
  onRemoveCoupon?:         () => void
  onUsePoints?:            (use: boolean) => void
  usingPoints?:            boolean
  onCheckout?:             () => void
  isLoading?:              boolean
  itemCount?:              number
  className?:              string
}

export function CartSummary({
  subtotal,
  deliveryFee,
  discount = 0,
  loyaltyDiscount = 0,
  total,
  couponCode,
  loyaltyPointsAvailable = 0,
  onApplyCoupon,
  onRemoveCoupon,
  onUsePoints,
  usingPoints = false,
  onCheckout,
  isLoading = false,
  itemCount = 0,
  className,
}: CartSummaryProps) {
  return (
    <div className={cn('flex flex-col gap-4 p-4', className)}>
      {/* Coupon */}
      {onApplyCoupon && (
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
            Code promo
          </p>
          <CouponInput
            onApply={onApplyCoupon}
            appliedCode={couponCode}
            onRemove={onRemoveCoupon}
          />
        </div>
      )}

      {/* Loyalty points toggle */}
      {loyaltyPointsAvailable > 0 && onUsePoints && (
        <div
          className={cn(
            'flex items-center justify-between px-3 py-2.5 rounded-xl',
            'border transition-colors duration-150 cursor-pointer',
            usingPoints
              ? 'bg-[var(--success-subtle)] border-[rgba(34,197,94,0.25)]'
              : 'bg-[var(--bg-surface)] border-[var(--border)]'
          )}
          onClick={() => onUsePoints(!usingPoints)}
          role="checkbox"
          aria-checked={usingPoints}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onUsePoints(!usingPoints) }}
        >
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Utiliser mes points fidélité
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {loyaltyPointsAvailable.toLocaleString('fr-FR')} points disponibles
            </p>
          </div>
          <span
            aria-hidden
            className={cn(
              'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150',
              usingPoints
                ? 'bg-[var(--success)] border-[var(--success)]'
                : 'border-[var(--border-strong)]'
            )}
          >
            {usingPoints && (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="white" aria-hidden>
                <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            )}
          </span>
        </div>
      )}

      <Divider />

      {/* Price breakdown */}
      <div className="flex flex-col gap-2" aria-label="Détail du prix">
        <PriceLine label="Sous-total" value={subtotal} />
        <PriceLine label="Livraison" value={deliveryFee} />
        {discount > 0 && (
          <PriceLine label="Réduction coupon" value={-discount} color="success" />
        )}
        {loyaltyDiscount > 0 && (
          <PriceLine label="Réduction points" value={-loyaltyDiscount} color="success" />
        )}
      </div>

      <Divider />

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-[var(--text-primary)]">Total</span>
        <span
          className="text-xl font-bold text-[var(--brand)]"
          aria-label={`Total : ${formatFCFA(total)}`}
        >
          {formatFCFA(total)}
        </span>
      </div>

      {/* Checkout CTA */}
      <Button
        fullWidth
        size="lg"
        loading={isLoading}
        disabled={itemCount === 0}
        onClick={onCheckout}
        aria-label={`Commander — ${itemCount} article${itemCount > 1 ? 's' : ''} — ${formatFCFA(total)}`}
      >
        Commander • {formatFCFA(total)}
      </Button>
    </div>
  )
}

function PriceLine({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color?: 'success' | 'danger'
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span
        className={cn(
          'font-medium',
          color === 'success' && 'text-[var(--success)]',
          color === 'danger' && 'text-[var(--danger)]',
          !color && 'text-[var(--text-primary)]'
        )}
      >
        {value < 0 ? '-' : ''}{formatFCFA(Math.abs(value))}
      </span>
    </div>
  )
}
