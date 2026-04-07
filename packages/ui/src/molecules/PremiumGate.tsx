'use client'

import * as React from 'react'
import { cn } from '../utils'
import { CrownIcon, CheckIcon, LockIcon } from '../icons'
import { Button } from '../atoms/Button'

export interface PremiumPlan {
  id:          string
  label:       string
  price:       number
  period:      string
  badge?:      string
  features?:   string[]
}

export interface PremiumGateProps {
  title?:        string
  description?:  string
  features?:     string[]
  plans?:        PremiumPlan[]
  onSubscribe?:  (planId: string) => void
  isLoading?:    boolean
  children?:     React.ReactNode
  blurContent?:  boolean
  className?:    string
}

export function PremiumGate({
  title = 'Contenu Premium',
  description = 'Accédez à toutes les recettes et fonctionnalités exclusives.',
  features = [],
  plans = [],
  onSubscribe,
  isLoading = false,
  children,
  blurContent = true,
  className,
}: PremiumGateProps) {
  const [selectedPlan, setSelectedPlan] = React.useState(plans[0]?.id ?? '')

  return (
    <div className={cn('relative', className)}>
      {/* Blurred content preview */}
      {children && blurContent && (
        <div
          className="pointer-events-none select-none"
          aria-hidden
          style={{ filter: 'blur(8px)', opacity: 0.4, userSelect: 'none' }}
        >
          {children}
        </div>
      )}

      {/* Gate overlay */}
      <div
        className={cn(
          'flex flex-col items-center gap-5 px-5 py-8 rounded-2xl',
          'bg-[var(--bg-surface)] border border-[var(--border-brand)]',
          'shadow-[var(--shadow-lg)]',
          children && blurContent && 'absolute inset-0'
        )}
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-amber-500/30 to-yellow-400/20 border border-amber-500/30">
          <CrownIcon size={28} className="text-amber-400" />
        </div>

        {/* Text */}
        <div className="text-center">
          <h2 className="text-base font-bold text-[var(--text-primary)]">{title}</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">{description}</p>
        </div>

        {/* Features */}
        {features.length > 0 && (
          <ul className="self-stretch flex flex-col gap-2" role="list">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
                <CheckIcon size={14} className="text-[var(--success)] shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        )}

        {/* Plan selector */}
        {plans.length > 0 && (
          <div className="self-stretch flex flex-col gap-2">
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                role="radio"
                aria-checked={selectedPlan === plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={cn(
                  'flex items-center justify-between px-4 py-3 rounded-xl text-sm',
                  'border transition-all duration-150',
                  selectedPlan === plan.id
                    ? 'border-[var(--brand)] bg-[var(--brand-subtle)] text-[var(--text-primary)]'
                    : 'border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-secondary)]'
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                      selectedPlan === plan.id
                        ? 'border-[var(--brand)]'
                        : 'border-[var(--border-strong)]'
                    )}
                  >
                    {selectedPlan === plan.id && (
                      <span className="w-2 h-2 rounded-full bg-[var(--brand)]" />
                    )}
                  </span>
                  <span className="font-medium">{plan.label}</span>
                  {plan.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--brand)] text-white font-semibold">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-[var(--text-primary)]">
                  {plan.price.toLocaleString('fr-FR')} FCFA/{plan.period}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* CTA */}
        <Button
          fullWidth
          loading={isLoading}
          onClick={() => onSubscribe?.(selectedPlan)}
          leftIcon={<CrownIcon size={16} />}
          className="mt-2"
        >
          S&apos;abonner Premium
        </Button>

        {/* Lock note */}
        <p className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <LockIcon size={11} /> Résiliation possible à tout moment
        </p>
      </div>
    </div>
  )
}
