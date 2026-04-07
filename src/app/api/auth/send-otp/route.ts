/**
 * POST /api/auth/send-otp
 *
 * Envoie un code OTP 6 chiffres par SMS via Twilio Verify.
 * - Rate limit : 5 SMS / heure / IP (Redis sliding window)
 * - Validation stricte numéro camerounais +237XXXXXXXXX
 *
 * Body    : { telephone: string }
 * Response: { success: true, expiresIn: 300, maskedPhone: string }
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'
import { sendOtpViaTwilio } from '@/services/auth/twilio'
import { safeValidate, loginSchema, normalizeTelephone } from '@/lib/security/validation'

// ─── Redis — rate limit OTP par IP ───────────────────────────────────────────

const _redis = (() => {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
})()

const OTP_LIMIT     = 5
const OTP_WINDOW_S  = 60 * 60   // 1 heure

async function checkOtpRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  if (!_redis) return { allowed: true, remaining: OTP_LIMIT, resetIn: 0 }

  const key = `rl:otp:${ip}`
  try {
    const count = await _redis.incr(key)
    if (count === 1) await _redis.expire(key, OTP_WINDOW_S)
    const ttl = await _redis.ttl(key)

    const remaining = Math.max(0, OTP_LIMIT - count)
    return {
      allowed:  count <= OTP_LIMIT,
      remaining,
      resetIn: ttl > 0 ? ttl : OTP_WINDOW_S,
    }
  } catch {
    // Redis indisponible — fail open
    return { allowed: true, remaining: OTP_LIMIT, resetIn: 0 }
  }
}

// ─── Masquage du numéro ───────────────────────────────────────────────────────
// Ex: +237697580863 → "+237 6** *** 63"

function maskPhone(telephone: string): string {
  // telephone est déjà normalisé (+237XXXXXXXXX)
  const digits = telephone.replace('+237', '')   // 9 chiffres
  if (digits.length < 9) return telephone
  const first  = digits[0]                        // "6"
  const last2  = digits.slice(-2)                 // "63"
  return `+237 ${first}** *** ${last2}`
}

// ─── IP helper ────────────────────────────────────────────────────────────────

function getIp(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.ip ??
    'unknown'
  )
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = getIp(request)

  // ── Rate limit ─────────────────────────────────────────────────────────────
  const rl = await checkOtpRateLimit(ip)
  if (!rl.allowed) {
    const minutes = Math.ceil(rl.resetIn / 60)
    return NextResponse.json(
      {
        error:   `Trop de demandes. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.`,
        resetIn: rl.resetIn,
      },
      {
        status:  429,
        headers: { 'Retry-After': String(rl.resetIn) },
      }
    )
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 })
  }

  const { data, error } = safeValidate(loginSchema, body)
  if (error) {
    return NextResponse.json(
      { error: 'Numéro de téléphone camerounais invalide', details: error.flatten() },
      { status: 400 }
    )
  }

  const telephone  = normalizeTelephone(data.telephone)
  const maskedPhone = maskPhone(telephone)

  console.log(`[send-otp] Envoi OTP → ${maskedPhone} (ip=${ip}, remaining=${rl.remaining - 1})`)

  // ── Envoi Twilio ────────────────────────────────────────────────────────────
  const result = await sendOtpViaTwilio(telephone)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 503 })
  }

  return NextResponse.json({
    success:     true,
    expiresIn:   result.expiresIn,  // 300 secondes
    maskedPhone,
  })
}
