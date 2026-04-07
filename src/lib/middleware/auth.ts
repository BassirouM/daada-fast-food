/**
 * API Gateway — Middleware d'authentification
 *
 * Utilisé par les API routes Next.js pour vérifier les access tokens.
 * Compatible edge runtime (jose uniquement, pas de bcrypt).
 *
 * Usage dans une API route :
 *   import { withAuth, withRole } from '@/lib/middleware/auth'
 *
 *   export const GET = withAuth(async (request, { user }) => {
 *     return NextResponse.json({ userId: user.id })
 *   })
 *
 *   export const POST = withRole('admin')(async (request, { user }) => { ... })
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAccessToken, extractBearerToken } from '@/lib/auth/jwt'
import type { VerifiedPayload } from '@/lib/auth/jwt'

// ─── Routes publiques (pas de vérification d'auth) ───────────────────────────

const PUBLIC_PATTERNS: RegExp[] = [
  /^\/api\/menu\//,
  /^\/api\/recipes\/[^/]+\/free/,
  /^\/api\/stores(\/|$)/,
  /^\/api\/auth\//,
  /^\/api\/map\/zones/,
]

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATTERNS.some((p) => p.test(pathname))
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthContext = {
  user: {
    id:          string
    role:        string
    telephone:   string
    restaurantId?: string
  }
}

type AuthedHandler = (
  request: NextRequest,
  ctx: AuthContext,
  params?: Record<string, string>
) => Promise<NextResponse> | NextResponse

// ─── Extraction du token ──────────────────────────────────────────────────────

async function extractAndVerify(request: NextRequest): Promise<VerifiedPayload | null> {
  // 1. Authorization: Bearer <token>
  const bearer = extractBearerToken(request.headers.get('authorization'))
  if (bearer) return verifyAccessToken(bearer)

  // 2. Cookie httpOnly daada-at
  const cookieToken = request.cookies.get('daada-at')?.value
  if (cookieToken) return verifyAccessToken(cookieToken)

  return null
}

// ─── withAuth — HOC pour route protégée ──────────────────────────────────────

export function withAuth(handler: AuthedHandler) {
  return async function (
    request: NextRequest,
    params?: Record<string, string>
  ): Promise<NextResponse> {
    const payload = await extractAndVerify(request)

    if (!payload) {
      return NextResponse.json(
        { error: 'Non authentifié. Token manquant ou expiré.' },
        { status: 401 }
      )
    }

    const ctx: AuthContext = {
      user: {
        id:        payload.sub,
        role:      payload.role,
        telephone: payload.telephone,
      },
    }

    return handler(request, ctx, params)
  }
}

// ─── withRole — HOC pour route protégée par rôle ─────────────────────────────

export function withRole(...roles: string[]) {
  return function (handler: AuthedHandler) {
    return async function (
      request: NextRequest,
      params?: Record<string, string>
    ): Promise<NextResponse> {
      const payload = await extractAndVerify(request)

      if (!payload) {
        return NextResponse.json(
          { error: 'Non authentifié.' },
          { status: 401 }
        )
      }

      if (!roles.includes(payload.role)) {
        console.warn(
          `[auth-middleware] Accès refusé — userId=${payload.sub} role=${payload.role} requis=[${roles.join(',')}] path=${request.nextUrl.pathname}`
        )
        return NextResponse.json(
          { error: 'Accès refusé. Droits insuffisants.' },
          { status: 403 }
        )
      }

      const ctx: AuthContext = {
        user: {
          id:        payload.sub,
          role:      payload.role,
          telephone: payload.telephone,
        },
      }

      return handler(request, ctx, params)
    }
  }
}

// ─── requireAuth — Vérification inline (sans HOC) ────────────────────────────

export async function requireAuth(
  request: NextRequest
): Promise<{ payload: VerifiedPayload } | NextResponse> {
  const payload = await extractAndVerify(request)
  if (!payload) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }
  return { payload }
}

// ─── Logging ─────────────────────────────────────────────────────────────────

export function logAuthAttempt(
  ip: string,
  maskedPhone: string,
  action: string,
  success: boolean
): void {
  const level  = success ? 'INFO' : 'WARN'
  const result = success ? 'OK' : 'FAIL'
  console.log(
    `[AUTH][${level}] action=${action} phone=${maskedPhone} ip=${ip} result=${result} ts=${new Date().toISOString()}`
  )
}

export function maskPhone(telephone: string): string {
  const digits = telephone.replace('+237', '')
  if (digits.length < 9) return '***'
  return `+237 ${digits[0]}** *** ${digits.slice(-2)}`
}
