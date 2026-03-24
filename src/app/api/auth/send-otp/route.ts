/**
 * POST /api/auth/send-otp
 * Envoie un code OTP par SMS via Twilio Verify.
 *
 * Body : { telephone: string }
 * Response : { success: boolean, expiresIn: number }
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { sendOtpViaTwilio } from '@/services/auth/twilio'
import { safeValidate, loginSchema, normalizeTelephone } from '@/lib/security/validation'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 })
  }

  // Validation
  const { data, error } = safeValidate(loginSchema, body)
  if (error) {
    return NextResponse.json(
      { error: 'Numéro de téléphone invalide', details: error.flatten() },
      { status: 400 }
    )
  }

  const telephone = normalizeTelephone(data.telephone)

  // Envoi OTP
  const result = await sendOtpViaTwilio(telephone)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 503 })
  }

  return NextResponse.json({
    success: true,
    expiresIn: result.expiresIn,
  })
}
