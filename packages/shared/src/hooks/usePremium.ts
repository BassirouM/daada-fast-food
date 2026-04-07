/**
 * usePremium — Hook partagé pour l'état d'abonnement premium
 *
 * Lit l'état premium depuis le profil utilisateur (champs premium_active,
 * premium_plan, premium_expires_at de la table users / app_metadata).
 *
 * Usage:
 *   const { isActive, plan, expiresAt, daysRemaining } = usePremium(user)
 */

import { useMemo } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PremiumPlan = 'monthly' | 'quarterly' | 'yearly' | null

export type PremiumUser = {
  premium_active?:      boolean
  premium_plan?:        PremiumPlan
  premium_expires_at?:  string | null
}

export type UsePremiumReturn = {
  /** L'abonnement est actif et non expiré */
  isActive:      boolean
  /** Plan souscrit */
  plan:          PremiumPlan
  /** Date d'expiration (objet Date ou null) */
  expiresAt:     Date | null
  /** Jours restants avant expiration (0 si expiré, null si pas d'abonnement) */
  daysRemaining: number | null
  /** Renouvellement bientôt (≤ 7 jours) */
  renewingSoon:  boolean
}

// ─── Implémentation ───────────────────────────────────────────────────────────

export function usePremium(user: PremiumUser | null | undefined): UsePremiumReturn {
  return useMemo(() => {
    if (!user || !user.premium_active) {
      return { isActive: false, plan: null, expiresAt: null, daysRemaining: null, renewingSoon: false }
    }

    const expiresAt = user.premium_expires_at ? new Date(user.premium_expires_at) : null
    const now       = new Date()
    const isExpired = expiresAt ? expiresAt < now : false
    const isActive  = user.premium_active && !isExpired

    let daysRemaining: number | null = null
    if (expiresAt) {
      const diffMs = expiresAt.getTime() - now.getTime()
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    }

    const renewingSoon = isActive && daysRemaining !== null && daysRemaining <= 7

    return {
      isActive,
      plan:    user.premium_plan ?? null,
      expiresAt,
      daysRemaining,
      renewingSoon,
    }
  }, [
    user?.premium_active,
    user?.premium_plan,
    user?.premium_expires_at,
  ])
}

// ─── Variante avec fetch (autonome, sans user passé en paramètre) ─────────────

import { useState, useEffect } from 'react'

export type UsePremiumStandaloneOptions = {
  baseUrl?: string
}

export type UsePremiumStandaloneReturn = UsePremiumReturn & {
  isLoading: boolean
  refetch:   () => Promise<void>
}

export function usePremiumStandalone(options: UsePremiumStandaloneOptions = {}): UsePremiumStandaloneReturn {
  const { baseUrl = '' } = options
  const [user,      setUser]      = useState<PremiumUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function refetch() {
    setIsLoading(true)
    try {
      const res = await fetch(`${baseUrl}/api/auth/me`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json() as { user: PremiumUser }
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { void refetch() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const premiumState = usePremium(user)
  return { ...premiumState, isLoading, refetch }
}
