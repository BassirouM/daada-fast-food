/**
 * JWT utilities — edge-compatible (jose)
 *
 * Access token  : HS256, expire 15 min
 * Refresh token : HS256, expire 7 jours
 * Blacklist     : Upstash Redis (TTL = durée restante du token)
 * Cookies       : httpOnly + Secure + SameSite=Strict
 */

import { SignJWT, jwtVerify } from 'jose'
import { Redis } from '@upstash/redis'

// ─── Configuration ────────────────────────────────────────────────────────────

const JWT_SECRET         = process.env.JWT_SECRET ?? ''
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? ''
const ISSUER             = 'daada-fast-food'
const AUDIENCE           = 'daada-app'
const AUDIENCE_REFRESH   = 'daada-app-refresh'
const IS_PROD            = process.env.NODE_ENV === 'production'

if (!JWT_SECRET && typeof window === 'undefined') {
  console.warn('[JWT] JWT_SECRET non défini — tokens non sécurisés. Définir en production.')
}

// Clés encodées une seule fois au démarrage du module
const accessSecret  = new TextEncoder().encode(
  JWT_SECRET         || 'daada-dev-access-secret-insecure-32chars!'
)
const refreshSecret = new TextEncoder().encode(
  JWT_REFRESH_SECRET || 'daada-dev-refresh-secret-insecure-32ch!'
)

// ─── Redis (optionnel — blacklist tokens révoqués) ───────────────────────────

const _redis = (() => {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
})()

// ─── Types ────────────────────────────────────────────────────────────────────

export type TokenPayload = {
  sub: string        // user ID (Supabase UUID)
  role: string       // 'customer' | 'admin' | 'delivery_agent' | 'kitchen' | 'super_admin'
  telephone: string
}

export type VerifiedPayload = TokenPayload & {
  jti: string
  iat: number
  exp: number
}

export type TokenPair = {
  accessToken: string
  refreshToken: string
}

export type CookieOptions = {
  httpOnly: boolean
  secure: boolean
  sameSite: 'strict' | 'lax' | 'none'
  path: string
  maxAge: number
}

// ─── Noms des cookies ─────────────────────────────────────────────────────────

export const ACCESS_TOKEN_COOKIE  = 'daada-at'
export const REFRESH_TOKEN_COOKIE = 'daada-rt'

// ─── Génération ───────────────────────────────────────────────────────────────

export async function generateAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ role: payload.role, telephone: payload.telephone })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('15m')
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setJti(crypto.randomUUID())
    .sign(accessSecret)
}

export async function generateRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE_REFRESH)
    .setJti(crypto.randomUUID())
    .sign(refreshSecret)
}

export async function generateTokenPair(payload: TokenPayload): Promise<TokenPair> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload.sub),
  ])
  return { accessToken, refreshToken }
}

// ─── Vérification ─────────────────────────────────────────────────────────────

export async function verifyAccessToken(token: string): Promise<VerifiedPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret, {
      issuer: ISSUER,
      audience: AUDIENCE,
    })

    if (!payload.sub || !payload.jti || !payload.iat || !payload.exp) return null

    // Vérifier si le token est révoqué
    if (await isTokenRevoked(payload.jti)) return null

    return {
      sub:       payload.sub,
      role:      (payload['role'] as string | undefined) ?? 'customer',
      telephone: (payload['telephone'] as string | undefined) ?? '',
      jti:       payload.jti,
      iat:       payload.iat,
      exp:       payload.exp,
    }
  } catch {
    return null
  }
}

export async function verifyRefreshToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret, {
      issuer: ISSUER,
      audience: AUDIENCE_REFRESH,
    })
    if (!payload.sub || !payload.jti) return null
    if (await isTokenRevoked(payload.jti)) return null
    return payload.sub
  } catch {
    return null
  }
}

/**
 * Extrait le token depuis le header Authorization: Bearer <token>
 * ou depuis le cookie httpOnly.
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7).trim()
  return token.length > 0 ? token : null
}

// ─── Blacklist Redis ──────────────────────────────────────────────────────────

const BLACKLIST_PREFIX = 'jwt:revoked:'

/**
 * Révoque un token en l'ajoutant à la blacklist Redis.
 * Le TTL correspond à la durée restante du token.
 */
export async function revokeToken(jti: string, expiresAt: number): Promise<void> {
  if (!_redis) return
  const ttlSeconds = Math.max(1, expiresAt - Math.floor(Date.now() / 1000))
  try {
    await _redis.setex(`${BLACKLIST_PREFIX}${jti}`, ttlSeconds, '1')
  } catch (err) {
    console.error('[JWT] Impossible de révoquer le token Redis :', err)
  }
}

export async function isTokenRevoked(jti: string): Promise<boolean> {
  if (!_redis) return false
  try {
    const result = await _redis.get(`${BLACKLIST_PREFIX}${jti}`)
    return result !== null
  } catch {
    return false // fail open — ne pas bloquer si Redis est indisponible
  }
}

// ─── Temp token (phone vérifiée, profil à compléter) ─────────────────────────

const TEMP_TOKEN_AUDIENCE = 'daada-app-temp'
const tempSecret = new TextEncoder().encode(
  (process.env.JWT_TEMP_SECRET ?? process.env.JWT_SECRET ?? '') ||
  'daada-dev-temp-secret-insecure-32chars!!'
)

export type TempTokenPayload = {
  telephone: string  // +237XXXXXXXXX
}

export type VerifiedTempPayload = TempTokenPayload & {
  jti: string
  iat: number
  exp: number
}

/** Génère un token court (10 min) attestant que le numéro a été vérifié par OTP. */
export async function generateTempToken(telephone: string): Promise<string> {
  return new SignJWT({ telephone, isTemp: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('TEMP')
    .setIssuedAt()
    .setExpirationTime('10m')
    .setIssuer(ISSUER)
    .setAudience(TEMP_TOKEN_AUDIENCE)
    .setJti(crypto.randomUUID())
    .sign(tempSecret)
}

/** Vérifie et décode un temp token. Retourne null si invalide / expiré. */
export async function verifyTempToken(token: string): Promise<VerifiedTempPayload | null> {
  try {
    const { payload } = await jwtVerify(token, tempSecret, {
      issuer:   ISSUER,
      audience: TEMP_TOKEN_AUDIENCE,
    })
    const telephone = payload['telephone'] as string | undefined
    if (!telephone || !payload.jti || !payload.iat || !payload.exp) return null
    return {
      telephone,
      jti: payload.jti,
      iat: payload.iat,
      exp: payload.exp,
    }
  } catch {
    return null
  }
}

// ─── Options cookies ──────────────────────────────────────────────────────────

export function getAccessTokenCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: 'strict',
    path:     '/',
    maxAge:   15 * 60,              // 15 minutes
  }
}

export function getRefreshTokenCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: 'strict',
    path:     '/api/auth',          // cookie envoyé uniquement au endpoint de refresh
    maxAge:   7 * 24 * 60 * 60,    // 7 jours
  }
}

export function getClearCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: 'strict',
    path:     '/',
    maxAge:   0,
  }
}
