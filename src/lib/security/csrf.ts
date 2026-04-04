/**
 * Protection CSRF (Cross-Site Request Forgery)
 *
 * Stratégie : Double Submit Cookie
 *   1. Le serveur génère un token et le place dans un cookie non-httpOnly.
 *   2. Le client JavaScript lit le cookie et l'envoie dans le header `x-csrf-token`.
 *   3. Le serveur compare le cookie et le header — ils doivent être identiques.
 *
 * Note : SameSite=Strict atténue déjà CSRF. Cette couche est une défense en profondeur.
 *
 * Utilisation dans le middleware :
 *   const valid = verifyCsrf(request)
 *   if (!valid) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
 *
 * Utilisation dans le client :
 *   const token = getCsrfTokenFromCookie()
 *   fetch('/api/...', { headers: { 'x-csrf-token': token } })
 */

import type { NextRequest, NextResponse } from 'next/server'

// ─── Constantes ───────────────────────────────────────────────────────────────

export const CSRF_COOKIE = 'daada-csrf'
export const CSRF_HEADER = 'x-csrf-token'

// Méthodes HTTP "sûres" qui ne modifient pas l'état — pas de vérification CSRF
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE'])

const IS_PROD = process.env.NODE_ENV === 'production'

// ─── Génération ───────────────────────────────────────────────────────────────

/**
 * Génère un token CSRF aléatoire (UUID v4).
 * Compatible Edge Runtime (Web Crypto API).
 */
export function generateCsrfToken(): string {
  return crypto.randomUUID()
}

// ─── Vérification ─────────────────────────────────────────────────────────────

/**
 * Vérifie que la requête contient un token CSRF valide.
 * Retourne `true` pour les méthodes sûres (GET, HEAD, OPTIONS).
 */
export function verifyCsrf(request: NextRequest): boolean {
  if (SAFE_METHODS.has(request.method)) return true

  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value
  const headerToken = request.headers.get(CSRF_HEADER)

  if (!cookieToken || !headerToken) return false

  // Comparaison en temps constant pour éviter les timing attacks
  return timingSafeEqual(cookieToken, headerToken)
}

// ─── Cookie ───────────────────────────────────────────────────────────────────

/**
 * Pose le cookie CSRF sur la réponse.
 * NON httpOnly : le JavaScript doit pouvoir le lire pour l'envoyer en header.
 */
export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,      // accessible par JS (nécessaire pour Double Submit)
    secure:   IS_PROD,
    sameSite: 'strict',
    path:     '/',
    maxAge:   60 * 60 * 24,  // 24 heures
  })
}

/**
 * Initialise le cookie CSRF si absent — à appeler dans le middleware sur GET.
 */
export function ensureCsrfCookie(
  request: NextRequest,
  response: NextResponse
): string {
  const existing = request.cookies.get(CSRF_COOKIE)?.value
  if (existing) return existing
  const token = generateCsrfToken()
  setCsrfCookie(response, token)
  return token
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Comparaison en temps constant (mitigation timing attack).
 * Implémentation simple basée sur XOR des codes de caractères.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false

  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= (a.charCodeAt(i) ^ (b.charCodeAt(i)))
  }
  return diff === 0
}
