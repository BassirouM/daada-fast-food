/**
 * Service CinetPay — agrégateur de paiement Mobile Money pour le Cameroun.
 *
 * Fournit :
 *   - initierPaiement()    : crée une session de paiement CinetPay (idempotent via Redis)
 *   - verifierWebhook()    : valide la signature HMAC-SHA256 du callback
 *   - verifierStatut()     : interroge l'état d'une transaction
 */

import crypto from 'crypto'
import { Redis } from '@upstash/redis'
import { logAudit } from '@/lib/db/audit'

// ─── Config ───────────────────────────────────────────────────────────────────

const CINETPAY_API_URL  = 'https://api-checkout.cinetpay.com/v2/payment'
const CINETPAY_CHECK_URL = 'https://api-checkout.cinetpay.com/v2/payment/check'
const API_KEY           = process.env.CINETPAY_API_KEY    ?? ''
const SITE_ID           = process.env.CINETPAY_SITE_ID    ?? ''
const SECRET_KEY        = process.env.CINETPAY_SECRET_KEY ?? ''
const APP_URL           = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ─── Redis (idempotency + lock) ───────────────────────────────────────────────

const redis = (() => {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
})()

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CinetPayInitParams {
  transactionId:    string
  montant:          number
  commandeId:       string
  clientNom:        string
  clientTelephone:  string
  methode:          'orange_money' | 'mtn_momo'
}

export interface CinetPayInitResult {
  paymentUrl:    string
  transactionId: string
  code:          string
}

export type CinetPayStatut = 'ACCEPTED' | 'REFUSED' | 'CANCELLED' | 'PENDING'

export interface CinetPayWebhookPayload {
  cpm_site_id:        string
  cpm_trans_id:       string
  cpm_trans_date:     string
  cpm_amount:         string
  cpm_currency:       string
  cpm_subscriber_sid: string
  cpm_payment_config: string
  cpm_page_action:    string
  cpm_version:        string
  cpm_payment_date:   string
  cpm_error_message:  string
  signature:          string
  payment_method:     string
  cel_phone_num:      string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildHmac(payload: CinetPayWebhookPayload): string {
  // CinetPay HMAC : concaténation ordonnée de champs + secret key
  const data = [
    payload.cpm_site_id,
    payload.cpm_trans_id,
    payload.cpm_trans_date,
    payload.cpm_amount,
    payload.cpm_currency,
    payload.cpm_subscriber_sid,
    payload.cpm_payment_config,
    payload.cpm_page_action,
    payload.cpm_version,
    payload.cpm_payment_date,
    SECRET_KEY,
  ].join('')

  return crypto.createHash('sha256').update(data).digest('hex')
}

// ─── initierPaiement ──────────────────────────────────────────────────────────

export async function initierPaiement(params: CinetPayInitParams): Promise<CinetPayInitResult> {
  const { transactionId, montant, commandeId, clientNom, clientTelephone, methode } = params

  // Idempotency : si la même transaction a déjà été initiée, on retourne le cache
  if (redis) {
    const cached = await redis.get<string>(`cinetpay:init:${transactionId}`)
    if (cached) {
      return JSON.parse(cached) as CinetPayInitResult
    }
  }

  const paymentData = {
    apikey:            API_KEY,
    site_id:           SITE_ID,
    transaction_id:    transactionId,
    amount:            montant,
    currency:          'XAF',
    description:       `Commande Daada #${commandeId}`,
    customer_id:       clientTelephone,
    customer_name:     clientNom,
    customer_surname:  '',
    customer_phone_number: clientTelephone,
    customer_email:    '',
    customer_city:     'Maroua',
    customer_country:  'CM',
    customer_state:    'CM',
    customer_zip_code: '00000',
    notify_url:        `${APP_URL}/api/payment/webhook`,
    return_url:        `${APP_URL}/paiement/succes?tx=${transactionId}`,
    cancel_url:        `${APP_URL}/paiement/echec?tx=${transactionId}`,
    channels:          methode === 'mtn_momo' ? 'MOBILE_MONEY' : 'MOBILE_MONEY',
    metadata:          commandeId,
    lang:              'fr',
  }

  const response = await fetch(CINETPAY_API_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(paymentData),
  })

  if (!response.ok) {
    throw new Error(`CinetPay HTTP ${response.status}: ${await response.text()}`)
  }

  const json = await response.json() as {
    code:    string
    message: string
    data?:   { payment_url?: string }
  }

  if (json.code !== '201') {
    throw new Error(`CinetPay error ${json.code}: ${json.message}`)
  }

  const result: CinetPayInitResult = {
    paymentUrl:    json.data?.payment_url ?? '',
    transactionId,
    code:          json.code,
  }

  // Mettre en cache pour idempotency (TTL 24h)
  if (redis) {
    await redis.set(`cinetpay:init:${transactionId}`, JSON.stringify(result), { ex: 86400 })
  }

  return result
}

// ─── verifierWebhook ──────────────────────────────────────────────────────────

export function verifierWebhook(
  payload: CinetPayWebhookPayload,
): boolean {
  if (!SECRET_KEY) {
    console.warn('[CinetPay] CINETPAY_SECRET_KEY non configuré — skip HMAC')
    return true // permissif si pas de secret (dev)
  }

  const expected = buildHmac(payload)
  const received = payload.signature ?? ''

  const valid = crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(received.length === expected.length ? received : expected, 'hex'),
  )

  if (!valid) {
    // Log tentative invalide
    logAudit({
      userId:    'system',
      action:    'webhook_invalid_signature',
      tableName: 'paiements',
      recordId:  payload.cpm_trans_id,
      newData:   { received, expected, site_id: payload.cpm_site_id },
    }).catch(() => {})
  }

  return valid
}

// ─── verifierStatut ───────────────────────────────────────────────────────────

export async function verifierStatut(transactionId: string): Promise<CinetPayStatut> {
  const response = await fetch(CINETPAY_CHECK_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      apikey:         API_KEY,
      site_id:        SITE_ID,
      transaction_id: transactionId,
    }),
  })

  if (!response.ok) {
    throw new Error(`CinetPay check HTTP ${response.status}`)
  }

  const json = await response.json() as {
    code:  string
    data?: { status?: string }
  }

  const statusMap: Record<string, CinetPayStatut> = {
    ACCEPTED:  'ACCEPTED',
    REFUSED:   'REFUSED',
    CANCELLED: 'CANCELLED',
    PENDING:   'PENDING',
  }

  const raw = json.data?.status?.toUpperCase() ?? 'PENDING'
  return statusMap[raw] ?? 'PENDING'
}
