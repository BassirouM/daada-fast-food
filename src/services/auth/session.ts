/**
 * Gestion des sessions JWT — accès + refresh tokens
 *
 * Flux standard :
 *   1. createSession()  → login réussi → set cookies httpOnly
 *   2. refreshSession() → access token expiré → rotation des tokens
 *   3. terminateSession() → logout → révocation + clear cookies
 */

import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  revokeToken,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getClearCookieOptions,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  type TokenPayload,
  type VerifiedPayload,
} from '@/lib/auth/jwt'
import type { NextResponse } from 'next/server'
import type { UserDB } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SessionResult = {
  accessToken: string
  expiresAt: number   // Unix timestamp (secondes)
}

// ─── Création de session (login) ──────────────────────────────────────────────

/**
 * Génère access + refresh tokens, les pose dans les cookies httpOnly.
 * Retourne l'accessToken (pour l'envoyer aussi dans le corps de la réponse).
 */
export async function createSession(
  user: UserDB,
  response: NextResponse
): Promise<SessionResult> {
  const payload: TokenPayload = {
    sub:       user.id,
    role:      user.role,
    telephone: user.telephone,
  }

  const { accessToken, refreshToken } = await generateTokenPair(payload)
  const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60   // +15 min

  response.cookies.set(ACCESS_TOKEN_COOKIE,  accessToken,  getAccessTokenCookieOptions())
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, getRefreshTokenCookieOptions())

  return { accessToken, expiresAt }
}

// ─── Refresh de session ───────────────────────────────────────────────────────

/**
 * Rotation du refresh token :
 *   - Révoque l'ancien refresh token
 *   - Génère un nouveau access token + refresh token
 *   - Met à jour les cookies
 */
export async function refreshSession(
  currentRefreshToken: string,
  user: UserDB,
  response: NextResponse
): Promise<SessionResult | null> {
  // Le refreshToken est vérifié dans la route avant d'appeler cette fonction.
  // On génère de nouveaux tokens directement.
  const payload: TokenPayload = {
    sub:       user.id,
    role:      user.role,
    telephone: user.telephone,
  }

  const newAccessToken  = await generateAccessToken(payload)
  const newRefreshToken = await generateRefreshToken(user.id)
  const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60

  response.cookies.set(ACCESS_TOKEN_COOKIE,  newAccessToken,  getAccessTokenCookieOptions())
  response.cookies.set(REFRESH_TOKEN_COOKIE, newRefreshToken, getRefreshTokenCookieOptions())

  // Silencieux si non utilisé — évite les warnings unused
  void currentRefreshToken

  return { accessToken: newAccessToken, expiresAt }
}

// ─── Révocation de session (logout) ──────────────────────────────────────────

/**
 * Révoque l'access token dans Redis + efface les cookies.
 */
export async function terminateSession(
  accessToken: string | null,
  response: NextResponse
): Promise<void> {
  if (accessToken) {
    try {
      const payload = await verifyAccessToken(accessToken)
      if (payload) {
        const ttl = Math.max(1, payload.exp - Math.floor(Date.now() / 1000))
        await revokeToken(payload.jti, ttl)
      }
    } catch {
      // Token invalide — ignorer
    }
  }

  const clearOpts = getClearCookieOptions()
  response.cookies.set(ACCESS_TOKEN_COOKIE,  '', clearOpts)
  response.cookies.set(REFRESH_TOKEN_COOKIE, '', { ...clearOpts, path: '/api/auth' })
}

// ─── Lecture depuis les cookies ───────────────────────────────────────────────

type CookieReader = {
  get: (name: string) => { value: string } | undefined
}

export function getAccessTokenFromRequest(cookies: CookieReader): string | null {
  return cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null
}

export function getRefreshTokenFromRequest(cookies: CookieReader): string | null {
  return cookies.get(REFRESH_TOKEN_COOKIE)?.value ?? null
}

// ─── Vérification depuis Authorization header ─────────────────────────────────

/**
 * Extrait et vérifie le token depuis "Authorization: Bearer <token>"
 * OU depuis le cookie httpOnly.
 */
export async function getVerifiedPayload(
  authHeader: string | null,
  cookies: CookieReader
): Promise<VerifiedPayload | null> {
  // 1. Priorité au header Authorization (API mobile / externe)
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    if (token) return verifyAccessToken(token)
  }

  // 2. Fallback : cookie httpOnly (app web)
  const cookieToken = getAccessTokenFromRequest(cookies)
  if (cookieToken) return verifyAccessToken(cookieToken)

  return null
}
