/**
 * Service Twilio Verify — Envoi et vérification d'OTP par SMS
 * Documentation : https://www.twilio.com/docs/verify/api
 *
 * En développement (sans variables Twilio configurées) :
 * - sendOtp  : succès simulé
 * - verifyOtp: accepte le code "123456"
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

// ─── Config ───────────────────────────────────────────────────────────────────

type TwilioConfig = {
  accountSid: string
  authToken: string
  verifyServiceSid: string
}

function getConfig(): TwilioConfig | null {
  const accountSid      = process.env.TWILIO_ACCOUNT_SID
  const authToken       = process.env.TWILIO_AUTH_TOKEN
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

  if (!accountSid || !authToken || !verifyServiceSid) return null
  return { accountSid, authToken, verifyServiceSid }
}

function basicAuth(accountSid: string, authToken: string): string {
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`
}

// ─── Envoi OTP ────────────────────────────────────────────────────────────────

export async function sendOtpViaTwilio(telephone: string): Promise<SendOtpResult> {
  const config = getConfig()

  // Mode développement — simuler un succès
  if (!config) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Twilio DEV] OTP simulé pour ${telephone}. Code test : 123456`)
      return { success: true, error: null, expiresIn: 300 }
    }
    return { success: false, error: 'Service SMS non configuré', expiresIn: 0 }
  }

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
      const err = await response.json() as { message?: string }
      return {
        success: false,
        error: err.message ?? "Échec de l'envoi du code SMS",
        expiresIn: 0,
      }
    }

    // Twilio Verify expire après 10 min — on indique 5 min à l'utilisateur
    return { success: true, error: null, expiresIn: 300 }
  } catch (err) {
    console.error('[Twilio] Erreur réseau :', err)
    return { success: false, error: 'Erreur réseau. Réessayez.', expiresIn: 0 }
  }
}

// ─── Vérification OTP ─────────────────────────────────────────────────────────

export async function verifyOtpViaTwilio(
  telephone: string,
  code: string
): Promise<VerifyOtpResult> {
  const config = getConfig()

  // Mode développement — accepter le code "123456"
  if (!config) {
    if (process.env.NODE_ENV !== 'production') {
      const approved = code === '123456'
      return {
        success: approved,
        status: approved ? 'approved' : 'failed',
        error: approved ? null : 'Code invalide (dev: utilisez 123456)',
      }
    }
    return { success: false, status: 'failed', error: 'Service SMS non configuré' }
  }

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

    const data = await response.json() as { status?: string; message?: string }
    const status = (data.status ?? 'failed') as VerificationStatus

    if (!response.ok || status !== 'approved') {
      const error =
        status === 'expired'   ? 'Code expiré. Demandez un nouveau code.' :
        status === 'canceled'  ? 'Vérification annulée.' :
        'Code incorrect. Vérifiez et réessayez.'

      return { success: false, status, error }
    }

    return { success: true, status: 'approved', error: null }
  } catch (err) {
    console.error('[Twilio] Erreur vérification :', err)
    return { success: false, status: 'failed', error: 'Erreur réseau. Réessayez.' }
  }
}
