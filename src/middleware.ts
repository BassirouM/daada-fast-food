import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ─── Route patterns ──────────────────────────────────────────────────────────

const PROTECTED_ROUTES = ['/checkout', '/profile', '/orders']
const ADMIN_ROUTES     = ['/admin']
const ADMIN_API        = ['/api/admin']
const AUTH_ROUTES      = ['/login', '/register']

// ─── Rate limiters ───────────────────────────────────────────────────────────
// Graceful degradation : si Upstash n'est pas configuré, le rate limiting est désactivé.

const _redisUrl   = process.env.UPSTASH_REDIS_REST_URL
const _redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

const _redis = _redisUrl && _redisToken
  ? new Redis({ url: _redisUrl, token: _redisToken })
  : null

// Auth : 5 requêtes / 15 min
const rlAuth = _redis
  ? new Ratelimit({ redis: _redis, limiter: Ratelimit.slidingWindow(5, '15 m'), prefix: 'rl:auth' })
  : null

// Paiement : 10 requêtes / min
const rlPayment = _redis
  ? new Ratelimit({ redis: _redis, limiter: Ratelimit.slidingWindow(10, '60 s'), prefix: 'rl:pay' })
  : null

// API générale : 100 requêtes / min
const rlApi = _redis
  ? new Ratelimit({ redis: _redis, limiter: Ratelimit.slidingWindow(100, '60 s'), prefix: 'rl:api' })
  : null

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getClientIp(req: NextRequest): string {
  const cfIp = req.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp

  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]
    if (first) return first.trim()
  }

  return req.ip ?? 'unknown'
}

async function applyRateLimit(
  limiter: Ratelimit,
  key: string,
  response: NextResponse
): Promise<NextResponse | null> {
  try {
    const { success, limit, remaining, reset } = await limiter.limit(key)
    response.headers.set('X-RateLimit-Limit',     limit.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset',     reset.toString())

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessayez plus tard.', retryAfter },
        {
          status: 429,
          headers: { 'Retry-After': retryAfter.toString() },
        }
      )
    }
  } catch {
    // Redis indisponible — on continue sans rate limiting
  }
  return null
}

function logSuspicious(ip: string, pathname: string, ua: string, reason: string): void {
  console.warn(
    `[Security] Requête suspecte — raison="${reason}" ip=${ip} path=${pathname} ua="${ua}"`
  )
}

// ─── Middleware principal ─────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl
  const ip = getClientIp(request)
  const ua = request.headers.get('user-agent') ?? ''

  // ── 1. Rate limiting ────────────────────────────────────────────────────────
  if (rlAuth && pathname.startsWith('/api/auth/')) {
    const blocked = await applyRateLimit(rlAuth, `auth:${ip}`, response)
    if (blocked) {
      logSuspicious(ip, pathname, ua, 'rate-limit-auth')
      return blocked
    }
  } else if (rlPayment && pathname.startsWith('/api/payment/')) {
    const blocked = await applyRateLimit(rlPayment, `pay:${ip}`, response)
    if (blocked) {
      logSuspicious(ip, pathname, ua, 'rate-limit-payment')
      return blocked
    }
  } else if (rlApi && pathname.startsWith('/api/')) {
    const blocked = await applyRateLimit(rlApi, `api:${ip}`, response)
    if (blocked) {
      logSuspicious(ip, pathname, ua, 'rate-limit-api')
      return blocked
    }
  }

  // ── 2. Session Supabase ─────────────────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // ── 3. Protection routes admin ──────────────────────────────────────────────
  const isAdminPath =
    ADMIN_ROUTES.some((r) => pathname.startsWith(r)) ||
    ADMIN_API.some((r) => pathname.startsWith(r))

  if (isAdminPath) {
    if (!session) {
      const url = new URL('/login', request.url)
      url.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(url)
    }

    // Rôle stocké dans app_metadata (défini côté serveur uniquement)
    const meta = session.user.app_metadata as Record<string, unknown>
    const role = meta['role']

    if (role !== 'admin' && role !== 'super_admin') {
      logSuspicious(ip, pathname, ua, `admin-access-denied:role=${String(role ?? 'none')}`)
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }
  }

  // ── 4. Routes protégées (authentification requise) ──────────────────────────
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))
  if (isProtected && !session) {
    const url = new URL('/login', request.url)
    url.searchParams.set('returnUrl', pathname)
    return NextResponse.redirect(url)
  }

  // ── 5. Pages auth (redirection si déjà connecté) ───────────────────────────
  const isAuthPage = AUTH_ROUTES.some((r) => pathname.startsWith(r))
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/menu', request.url))
  }

  // ── 6. Détection patterns suspects ─────────────────────────────────────────
  const hasPathTraversal = pathname.includes('..')
  const hasInjection     = /[<>'"`;]/.test(decodeURIComponent(pathname))
  const hasLfiAttempt    = /etc\/passwd|proc\/self|\.env/i.test(pathname)
  const suspiciousAdmin  = pathname.toLowerCase().includes('admin') && !session

  if (hasPathTraversal) logSuspicious(ip, pathname, ua, 'path-traversal')
  if (hasInjection)     logSuspicious(ip, pathname, ua, 'injection-attempt')
  if (hasLfiAttempt)    logSuspicious(ip, pathname, ua, 'lfi-attempt')
  if (suspiciousAdmin)  logSuspicious(ip, pathname, ua, 'unauthenticated-admin-probe')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-).*)',
  ],
}
