/**
 * Sentry — monitoring erreurs & performance
 *
 * Usage côté serveur (API routes) :
 *   import { captureError, setUserContext } from '@/lib/monitoring/sentry'
 *
 * L'initialisation principale se fait dans src/instrumentation.ts
 * via le mécanisme natif de Next.js.
 */

import * as Sentry from '@sentry/nextjs'

// ─── Config ───────────────────────────────────────────────────────────────────

const DSN         = process.env.NEXT_PUBLIC_SENTRY_DSN ?? ''
const ENVIRONMENT = process.env.NODE_ENV ?? 'development'
const RELEASE     = process.env.VERCEL_GIT_COMMIT_SHA ?? 'local'

// ─── Init (appelé par instrumentation.ts) ─────────────────────────────────────

export function initSentry() {
  if (!DSN) {
    if (ENVIRONMENT === 'production') {
      console.warn('[Sentry] NEXT_PUBLIC_SENTRY_DSN non configuré en production')
    }
    return
  }

  Sentry.init({
    dsn:         DSN,
    environment: ENVIRONMENT,
    release:     RELEASE,

    // Performance monitoring
    tracesSampleRate:   ENVIRONMENT === 'production' ? 0.1 : 1.0,
    profilesSampleRate: ENVIRONMENT === 'production' ? 0.05 : 0,

    // Ne pas tracker les erreurs en dev sauf si DSN configuré
    enabled: Boolean(DSN),

    // Ignorer les erreurs connues / non-actionnables
    ignoreErrors: [
      // Erreurs navigateur bénignes
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      // Erreurs réseau clients
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      // AbortController (fetch annulé)
      'AbortError',
      // FCM token errors (non-critiques)
      'messaging/permission-blocked',
      'messaging/unsupported-browser',
    ],

    beforeSend(event, hint) {
      const error = hint?.originalException

      // Ignorer les erreurs 404 et 401 (non-critiques)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status
        if (status === 404 || status === 401 || status === 403) return null
      }

      // Scrubber : supprimer données sensibles
      if (event.request) {
        if (event.request.cookies) {
          event.request.cookies = {}
        }
        if (event.request.headers && typeof event.request.headers === 'object') {
          const headers = event.request.headers as Record<string, string>
          if (headers['authorization']) headers['authorization'] = '[Filtered]'
          if (headers['cookie'])        headers['cookie']        = '[Filtered]'
        }
      }

      return event
    },

    // Intégrations
    integrations: [
      Sentry.extraErrorDataIntegration({ depth: 5 }),
      Sentry.requestDataIntegration(),
    ],
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Capture une erreur avec contexte additionnel.
 * Non-bloquant : ne throw jamais.
 */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  try {
    Sentry.withScope((scope) => {
      if (context) scope.setExtras(context)
      Sentry.captureException(error)
    })
  } catch {
    // Sentry ne doit jamais faire planter l'app
  }
}

/**
 * Définit le contexte utilisateur pour la session Sentry courante.
 * Appeler après authentication.
 */
export function setUserContext(user: {
  id:    string
  phone?: string
  role?: string
}): void {
  try {
    Sentry.setUser({
      id:    user.id,
      role:  user.role,
      // Ne jamais logger le numéro de téléphone complet
      phone: user.phone ? `+237 *** *** ${user.phone.slice(-3)}` : undefined,
    })
  } catch {
    //
  }
}

/**
 * Efface le contexte utilisateur (après logout).
 */
export function clearUserContext(): void {
  try {
    Sentry.setUser(null)
  } catch {
    //
  }
}

/**
 * Wrapper pour monitorer la performance d'une fonction.
 */
export async function withSpan<T>(
  name: string,
  op: string,
  fn: () => Promise<T>,
): Promise<T> {
  return Sentry.startSpan({ name, op }, fn)
}

/**
 * Wrapper API Route : capture automatiquement les erreurs non gérées.
 *
 * Usage :
 *   export const GET = withSentryApi(async (req) => { ... })
 */
export function withSentryApi<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>,
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args)
    } catch (err) {
      captureError(err)
      throw err
    }
  }
}
