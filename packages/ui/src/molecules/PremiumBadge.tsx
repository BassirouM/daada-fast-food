import * as React from 'react'
import { cn } from '../utils'
import { CrownIcon } from '../icons'

export type SubscriptionPlan = 'monthly' | 'quarterly' | 'yearly'
export type SubStatus = 'trial' | 'active' | 'expired' | 'cancelled'

export interface PremiumBadgeProps {
  plan?:       SubscriptionPlan
  expiresAt?:  string | null
  status?:     SubStatus
  className?:  string
  compact?:    boolean
}

const planLabels: Record<SubscriptionPlan, string> = {
  monthly:   'Mensuel',
  quarterly: 'Trimestriel',
  yearly:    'Annuel',
}

export function PremiumBadge({
  plan,
  expiresAt,
  status = 'active',
  className,
  compact = false,
}: PremiumBadgeProps) {
  const isActive  = status === 'active' || status === 'trial'
  const isTrial   = status === 'trial'
  const isExpired = status === 'expired'

  // Days remaining
  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000))
    : null

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
          isActive  && 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
          isExpired && 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]',
          className
        )}
        aria-label={`Abonnement premium ${isActive ? 'actif' : 'expiré'}`}
      >
        <CrownIcon size={11} />
        {isTrial ? 'Essai' : isExpired ? 'Expiré' : 'Premium'}
      </span>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3 rounded-2xl',
        'border',
        isActive  && 'bg-gradient-to-r from-amber-500/15 to-yellow-400/10 border-amber-500/30',
        isExpired && 'bg-[var(--bg-surface)] border-[var(--border)]',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center',
          isActive ? 'bg-amber-500/25' : 'bg-[var(--bg-elevated)]'
        )}>
          <CrownIcon size={16} className={isActive ? 'text-amber-400' : 'text-[var(--text-muted)]'} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {isExpired ? 'Abonnement expiré' : isTrial ? 'Période d\'essai' : 'Premium'}
            {plan && isActive && ` — ${planLabels[plan]}`}
          </p>
          {daysLeft !== null && isActive && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {daysLeft === 0 ? 'Expire aujourd\'hui' : `Expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`}
            </p>
          )}
          {isExpired && (
            <p className="text-xs text-[var(--danger)] mt-0.5">Abonnement terminé</p>
          )}
        </div>
      </div>

      {isActive && daysLeft !== null && daysLeft <= 7 && (
        <span className="text-xs font-semibold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">
          Renouveler
        </span>
      )}
    </div>
  )
}
