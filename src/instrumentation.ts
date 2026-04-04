/**
 * Next.js Instrumentation
 *
 * Ce fichier est exécuté au démarrage du serveur Next.js (côté serveur uniquement).
 * Il initialise Sentry et les outils de monitoring avant que l'app ne serve des requêtes.
 *
 * Docs : https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Sentry — serveur uniquement (pas Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initSentry } = await import('@/lib/monitoring/sentry')
    initSentry()

    if (process.env.NODE_ENV === 'development') {
      console.log('[instrumentation] Sentry initialisé (nodejs runtime)')
    }
  }

  // Edge runtime (middleware)
  if (process.env.NEXT_RUNTIME === 'edge') {
    // Pas de Sentry SDK complet en Edge — utiliser @sentry/nextjs edge config si besoin
  }
}

export const onRequestError = async (
  err: unknown,
  request: { path: string; method: string },
  context: { routeType: string }
) => {
  // Capture les erreurs de requêtes non gérées dans les Server Components / API Routes
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { captureError } = await import('@/lib/monitoring/sentry')
    captureError(err, {
      path:      request.path,
      method:    request.method,
      routeType: context.routeType,
    })
  }
}
