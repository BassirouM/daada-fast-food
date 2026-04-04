/**
 * PostHog — analytics & feature flags
 *
 * Events trackés :
 *   page_viewed, menu_searched, item_added_to_cart,
 *   checkout_started, order_placed, payment_completed,
 *   payment_failed, app_installed
 *
 * Usage :
 *   import { trackEvent, identifyUser } from '@/lib/monitoring/posthog'
 *   trackEvent('item_added_to_cart', { item_id: '...', montant: 2500 })
 */

'use client'

import posthog from 'posthog-js'

// ─── Config ───────────────────────────────────────────────────────────────────

const API_KEY  = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? ''
const HOST     = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com'
let   initialized = false

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initPostHog(): void {
  if (initialized || !API_KEY || typeof window === 'undefined') return

  posthog.init(API_KEY, {
    api_host:                        HOST,
    capture_pageview:                false, // On gère manuellement via trackPageView
    capture_pageleave:               true,
    persistence:                     'localStorage',
    autocapture:                     false, // Pas d'autocapture pour RGPD
    disable_session_recording:       true,
    opt_out_capturing_by_default:    false,
    loaded: (ph) => {
      // En dev : désactiver les envois réels
      if (process.env.NODE_ENV !== 'production') {
        ph.opt_out_capturing()
      }
    },
  })

  initialized = true
}

// ─── Event types ──────────────────────────────────────────────────────────────

export type TrackableEvent =
  | 'page_viewed'
  | 'menu_searched'
  | 'item_added_to_cart'
  | 'item_removed_from_cart'
  | 'checkout_started'
  | 'order_placed'
  | 'payment_completed'
  | 'payment_failed'
  | 'app_installed'
  | 'notification_permission_granted'
  | 'notification_permission_denied'
  | 'filter_applied'
  | 'address_saved'
  | 'reorder_started'

export interface EventProperties {
  // Commun
  quartier?:    string
  montant?:     number
  nb_articles?: number
  // Menu
  item_id?:     string
  item_nom?:    string
  categorie?:   string
  // Recherche
  query?:       string
  nb_resultats?: number
  // Commande
  commande_id?:      string
  methode_paiement?: string
  // Page
  page?:        string
  referrer?:    string
  // App
  platform?:    'web' | 'pwa' | 'ios' | 'android'
  // Erreur
  error_code?:  string
  provider?:    string
  [key: string]: unknown
}

// ─── trackEvent ───────────────────────────────────────────────────────────────

export function trackEvent(event: TrackableEvent, properties?: EventProperties): void {
  if (typeof window === 'undefined') return
  if (!initialized) initPostHog()

  try {
    posthog.capture(event, {
      ...properties,
      // Enrichissement automatique
      app_version: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
      timestamp:   new Date().toISOString(),
    })
  } catch {
    // Analytics ne doit jamais faire planter l'app
  }
}

// ─── trackPageView ────────────────────────────────────────────────────────────

export function trackPageView(url: string): void {
  const referrer = typeof document !== 'undefined' ? document.referrer : undefined
  trackEvent('page_viewed', {
    page: url,
    ...(referrer !== undefined && { referrer }),
  })
}

// ─── identifyUser ─────────────────────────────────────────────────────────────

export function identifyUser(userId: string, properties?: {
  role?:      string
  quartier?:  string
  createdAt?: string
}): void {
  if (typeof window === 'undefined') return
  if (!initialized) initPostHog()

  try {
    posthog.identify(userId, {
      role:       properties?.role,
      quartier:   properties?.quartier,
      created_at: properties?.createdAt,
    })
  } catch {
    //
  }
}

// ─── resetUser (logout) ───────────────────────────────────────────────────────

export function resetUser(): void {
  if (typeof window === 'undefined') return
  try { posthog.reset() } catch { /**/ }
}

// ─── Opt-out RGPD ─────────────────────────────────────────────────────────────

export function optOut(): void {
  if (typeof window === 'undefined') return
  try {
    posthog.opt_out_capturing()
    localStorage.setItem('daada-analytics-optout', '1')
  } catch { /**/ }
}

export function optIn(): void {
  if (typeof window === 'undefined') return
  try {
    posthog.opt_in_capturing()
    localStorage.removeItem('daada-analytics-optout')
  } catch { /**/ }
}

export function isOptedOut(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem('daada-analytics-optout') === '1'
}

// ─── Re-export posthog instance (usage avancé) ────────────────────────────────

export { posthog }
