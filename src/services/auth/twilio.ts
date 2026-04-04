/**
 * Service Twilio Verify — Envoi et vérification d'OTP par SMS
 * Documentation : https://www.twilio.com/docs/verify/api
 *
 * Modes :
 * - PRODUCTION  : appels Twilio réels
 * - TEST        : code "123456" accepté sans appel réseau
 *   Activé si NODE_ENV !== 'production' OU TWILIO_TEST_MODE=true
 */

const TWILIO_API_BASE = 'https://verify.twilio.com/v2'

// ─── Types ────────────────────────────────────────────────────────────────────

export type VerificationStatus =
  | 'pending'
  | 'approved'
  | 'canceled'
  | 'expired'
  | 'failed'

export type SendOtpResult = {
  success: boolean
  error: string | null
  expiresIn: number   // secondes
}

export type VerifyOtpResult = {
  success: boolean
  status: VerificationStatus
  error: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Mode test actif si NODE_ENV !== 'production' ou TWILIO_TEST_MODE=true.
 * Permet de tester sans appel réseau Twilio (code accepté : "123456").
 */
export function isTestMode(): boolean {
  return (
    process.env.TWILIO_TEST_MODE === 'true' ||
    process.env.NODE_ENV !== 'production'
  )
}

// ─── Config ───────────────────────────────────────────────────────────────────

type TwilioConfig = {
  accountSid: string
  authToken: string
  verifyServiceSid: string
}

function getConfig(): TwilioConfig | null {
  const accountSid       = process.env.TWILIO_ACCOUNT_SID
  const authToken        = process.env.TWILIO_AUTH_TOKEN
  const verifyServiceSid = process.env.TWILIO_SERVICE_SID

  if (!accountSid || !authToken || !verifyServiceSid) return null
  return { accountSid, authToken, verifyServiceSid }
}

function basicAuth(accountSid: string, authToken: string): string {
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`
}

// ─── Envoi OTP ────────────────────────────────────────────────────────────────

export async function sendOtpViaTwilio(telephone: string): Promise<SendOtpResult> {
  // Mode test — pas d'appel réseau
  if (isTestMode()) {
    console.log(`[Twilio TEST] sendOtp simulé pour "${telephone}". Code test : 123456`)
    return { success: true, error: null, expiresIn: 300 }
  }

  const config = getConfig()
  if (!config) {
    return { success: false, error: 'Service SMS non configuré', expiresIn: 0 }
  }

  console.log(`[Twilio] sendOtp → téléphone="${telephone}" serviceSid="${config.verifyServiceSid}"`)

  try {
    const body = new URLSearchParams({ To: telephone, Channel: 'sms' })

    const response = await fetch(
      `${TWILIO_API_BASE}/Services/${config.verifyServiceSid}/Verifications`,
      {
        method: 'POST',
        headers: {
          Authorization: basicAuth(config.accountSid, config.authToken),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    )

    if (!response.ok) {
      const err = await response.json() as { message?: string; code?: number }
      console.error(`[Twilio] sendOtp ERREUR status=${response.status} code=${err.code} message="${err.message}"`)
      return {
        success: false,
        error: err.message ?? "Échec de l'envoi du code SMS",
        expiresIn: 0,
      }
    }

    console.log(`[Twilio] sendOtp OK → OTP envoyé à "${telephone}"`)
    // Twilio Verify expire après 10 min — on indique 5 min à l'utilisateur
    return { success: true, error: null, expiresIn: 300 }
  } catch (err) {
    console.error('[Twilio] sendOtp erreur réseau :', err)
    return { success: false, error: 'Erreur réseau. Réessayez.', expiresIn: 0 }
  }
}

// ─── Vérification OTP ─────────────────────────────────────────────────────────

export async function verifyOtpViaTwilio(
  telephone: string,
  code: string
): Promise<VerifyOtpResult> {
  // Mode test — accepter uniquement le code "123456"
  if (isTestMode()) {
    const approved = code === '123456'
    if (approved) {
      console.log(`[Twilio TEST] MODE TEST - OTP accepté pour "${telephone}" (code=123456)`)
    } else {
      console.log(`[Twilio TEST] MODE TEST - OTP refusé pour "${telephone}" (code="${code}" ≠ "123456")`)
    }
    return {
      success: approved,
      status: approved ? 'approved' : 'failed',
      error: approved ? null : 'Code invalide (mode test : utilisez 123456)',
    }
  }

  const config = getConfig()
  if (!config) {
    return { success: false, status: 'failed', error: 'Service SMS non configuré' }
  }

  console.log(`[Twilio] verifyOtp → téléphone="${telephone}" serviceSid="${config.verifyServiceSid}" code="${code}"`)

  try {
    const body = new URLSearchParams({ To: telephone, Code: code })

    const response = await fetch(
      `${TWILIO_API_BASE}/Services/${config.verifyServiceSid}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          Authorization: basicAuth(config.accountSid, config.authToken),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    )

    const data = await response.json() as { status?: string; message?: string; code?: number }
    const status = (data.status ?? 'failed') as VerificationStatus

    console.log(`[Twilio] verifyOtp réponse → httpStatus=${response.status} otpStatus="${status}" twilio_code=${data.code ?? 'N/A'} message="${data.message ?? ''}"`)

    if (!response.ok || status !== 'approved') {
      const error =
        status === 'expired'   ? 'Code expiré. Demandez un nouveau code.' :
        status === 'canceled'  ? 'Vérification annulée.' :
        'Code incorrect. Vérifiez et réessayez.'

      return { success: false, status, error }
    }

    console.log(`[Twilio] verifyOtp OK → "${telephone}" approuvé`)
    return { success: true, status: 'approved', error: null }
  } catch (err) {
    console.error('[Twilio] verifyOtp erreur réseau :', err)
    return { success: false, status: 'failed', error: 'Erreur réseau. Réessayez.' }
  }
}

