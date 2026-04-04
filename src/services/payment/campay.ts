/**
 * Service CamPay — fallback si CinetPay est indisponible.
 *
 * CamPay est un agrégateur de paiement Mobile Money camerounais.
 * Il expose la même interface que cinetpay.ts pour permettre le basculement
 * transparent.
 *
 * Fournit :
 *   - initierPaiement()  : crée une demande de collecte CamPay
 *   - verifierWebhook()  : valide la signature HMAC-SHA256
 *   - verifierStatut()   : interroge le statut d'une transaction
 */

import crypto from 'crypto'
import { Redis } from '@upstash/redis'

// ─── Config ───────────────────────────────────────────────────────────────────

const CAMPAY_BASE_URL = process.env.CAMPAY_ENV === 'PROD'
  ? 'https://demo.campay.net/api'   // remplacer par URL prod
  : 'https://demo.campay.net/api'
const CAMPAY_USERNAME = process.env.CAMPAY_USERNAME ?? ''
const CAMPAY_PASSWORD = process.env.CAMPAY_PASSWORD ?? ''
const APP_URL         = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ─── Redis (idempotency + token cache) ───────────────────────────────────────

const redis = (() => {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
})()

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CamPayInitParams {
  transactionId:   string
  montant:         number
  commandeId:      string
  clientNom:       string
  clientTelephone: string
  methode:         'orange_money' | 'mtn_momo'
}

export interface CamPayInitResult {
  paymentUrl:    string
  transactionId: string
  reference:     string
}

export type CamPayStatut = 'ACCEPTED' | 'REFUSED' | 'CANCELLED' | 'PENDING'

export interface CamPayWebhookPayload {
  reference:      string
  status:         string
  amount:         number
  currency:       string
  operator:       string
  phone_number:   string
  external_ref:   string
  signature?:     string
}

// ─── Auth token (JWT CamPay, valide 60 min) ──────────────────────────────────

async function getToken(): Promise<string> {
  // Vérifier le cache Redis
  if (redis) {
    const cached = await redis.get<string>('campay:token')
    if (cached) return cached
  }

  const response = await fetch(`${CAMPAY_BASE_URL}/token/`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ username: CAMPAY_USERNAME, password: CAMPAY_PASSWORD }),
  })

  if (!response.ok) {
    throw new Error(`CamPay auth HTTP ${response.status}: ${await response.text()}`)
  }

  const json = await response.json() as { token: string }

  // Cache le token 55 min (expire à 60 min)
  if (redis && json.token) {
    await redis.set('campay:token', json.token, { ex: 55 * 60 })
  }

  return json.token
}

// ─── initierPaiement ──────────────────────────────────────────────────────────

export async function initierPaiement(params: CamPayInitParams): Promise<CamPayInitResult> {
  const { transactionId, montant, commandeId, clientTelephone, methode } = params

  // Idempotency check
  if (redis) {
    const cached = await redis.get<string>(`campay:init:${transactionId}`)
    if (cached) return JSON.parse(cached) as CamPayInitResult
  }

  const token = await getToken()

  // CamPay attend le numéro local (sans +237)
  const phone = clientTelephone.replace(/^\+?237/, '').replace(/\s/g, '')

  const body = {
    amount:        String(montant),
    currency:      'XAF',
    from:          phone,
    description:   `Commande Daada #${commandeId}`,
    external_ref:  transactionId,
    redirect_url:  `${APP_URL}/paiement/succes?tx=${transactionId}`,
    failure_redirect_url: `${APP_URL}/paiement/echec?tx=${transactionId}`,
    webhook_url:   `${APP_URL}/api/payment/webhook`,
    operator:      methode === 'mtn_momo' ? 'MTN' : 'ORANGE',
  }

  const response = await fetch(`${CAMPAY_BASE_URL}/collect/`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Token ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`CamPay collect HTTP ${response.status}: ${await response.text()}`)
  }

  const json = await response.json() as {
    reference:   string
    ussd_code?:  string
    payment_url?: string
    status:      string
  }

  const result: CamPayInitResult = {
    paymentUrl:    json.payment_url ?? `${APP_URL}/paiement/attente?tx=${transactionId}`,
    transactionId,
    reference:     json.reference,
  }

  // Mettre en cache pour idempotency (TTL 24h)
  if (redis) {
    await redis.set(`campay:init:${transactionId}`, JSON.stringify(result), { ex: 86400 })
    // Stocker aussi le mapping reference → transactionId pour le webhook
    await redis.set(`campay:ref:${json.reference}`, transactionId, { ex: 86400 })
  }

  return result
}

// ─── verifierWebhook ──────────────────────────────────────────────────────────

export function verifierWebhook(payload: CamPayWebhookPayload): boolean {
  const secret = process.env.CAMPAY_WEBHOOK_SECRET
  if (!secret) return true // permissif si pas configuré

  if (!payload.signature) return false

  const data     = `${payload.reference}${payload.amount}${payload.currency}${payload.external_ref}`
  const expected = crypto.createHmac('sha256', secret).update(data).digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(
        payload.signature.length === expected.length ? payload.signature : expected,
        'hex',
      ),
    )
  } catch {
    return false
  }
}

// ─── verifierStatut ───────────────────────────────────────────────────────────

export async function verifierStatut(reference: string): Promise<CamPayStatut> {
  const token = await getToken()

  const response = await fetch(`${CAMPAY_BASE_URL}/transaction/${reference}/`, {
    headers: { 'Authorization': `Token ${token}` },
  })

  if (!response.ok) {
    throw new Error(`CamPay check HTTP ${response.status}`)
  }

  const json = await response.json() as { status: string }

  const statusMap: Record<string, CamPayStatut> = {
    SUCCESSFUL: 'ACCEPTED',
    FAILED:     'REFUSED',
    PENDING:    'PENDING',
  }

  return statusMap[json.status?.toUpperCase()] ?? 'PENDING'
}
