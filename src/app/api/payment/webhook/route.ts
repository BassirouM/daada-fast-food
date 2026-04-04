/**
 * POST /api/payment/webhook
 *
 * Webhook CinetPay v2 — reçoit les notifications de paiement.
 *
 * Sécurité :
 *   - Vérification signature HMAC-SHA256 (cpm_secret_key CinetPay)
 *   - Idempotent : ignorer si paiement déjà traité
 *   - Log dans audit_log
 *
 * Payload CinetPay attendu :
 *   cpm_trans_id, cpm_site_id, cpm_trans_status, cpm_amount,
 *   cpm_currency, cpm_payid, cpm_error_message, signature
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createHmac } from 'crypto'
import { createAdminClient } from '@/lib/supabase'

// ─── Config ───────────────────────────────────────────────────────────────────

const CINETPAY_SECRET = process.env.CINETPAY_SECRET_KEY ?? ''

// ─── HMAC-SHA256 verification ─────────────────────────────────────────────────

function verifySignature(body: Record<string, unknown>, providedSig: string): boolean {
  if (!CINETPAY_SECRET) return true // En dev sans secret : ignorer la vérification

  // CinetPay : HMAC-SHA256 sur "amount|currency|trans_id"
  const message = `${String(body.cpm_amount)}${String(body.cpm_currency)}${String(body.cpm_trans_id)}`
  const expected = createHmac('sha256', CINETPAY_SECRET).update(message).digest('hex')
  return expected === providedSig
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  const {
    cpm_trans_id:     transactionId,
    cpm_trans_status: transStatus,
    cpm_amount:       montant,
    cpm_payid:        cpmPayid,
    signature,
  } = body

  if (!transactionId || !transStatus) {
    return NextResponse.json({ error: 'Payload incomplet' }, { status: 400 })
  }

  // 1. Vérification HMAC-SHA256
  const sigStr = typeof signature === 'string' ? signature : ''
  if (!verifySignature(body, sigStr)) {
    console.warn('[Webhook] Signature HMAC invalide — transactionId:', transactionId)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
  }

  const supabase   = createAdminClient()
  const clientIp   = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

  // 2. Trouver le paiement par transaction_id
  const { data: paiement, error: fetchErr } = await supabase
    .from('paiements')
    .select('id, commande_id, statut, montant')
    .eq('transaction_id', String(transactionId))
    .single()

  if (fetchErr || !paiement) {
    console.error('[Webhook] Paiement introuvable:', transactionId)
    return NextResponse.json({ error: 'Paiement introuvable' }, { status: 404 })
  }

  const paiementRecord = paiement as {
    id: string
    commande_id: string
    statut: string
    montant: number
  }

  // 3. Idempotence — ignorer si déjà traité
  if (paiementRecord.statut === 'completed' || paiementRecord.statut === 'failed') {
    return NextResponse.json({ received: true, skipped: true })
  }

  // 4. Mapper le statut CinetPay vers statut interne
  const statutMap: Record<string, string> = {
    ACCEPTED: 'completed',
    REFUSED:  'failed',
    CANCELLED: 'failed',
    PENDING:  'processing',
  }
  const statutInterne = statutMap[String(transStatus)] ?? 'processing'

  // 5. Update paiement
  await supabase
    .from('paiements')
    .update({
      statut:        statutInterne,
      transaction_id: String(cpmPayid ?? transactionId),
      cinetpay_data:  body,
    })
    .eq('id', paiementRecord.id)

  // 6. Update commande si paiement accepté ou refusé
  if (statutInterne === 'completed') {
    await supabase
      .from('commandes')
      .update({ statut: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', paiementRecord.commande_id)
  } else if (statutInterne === 'failed') {
    await supabase
      .from('commandes')
      .update({ statut: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', paiementRecord.commande_id)
  }

  // 7. Audit log
  await supabase.from('audit_log').insert({
    action:     `webhook_payment_${statutInterne}`,
    table_name: 'paiements',
    record_id:  paiementRecord.id,
    old_data:   { statut: paiementRecord.statut } as Record<string, unknown>,
    new_data:   { statut: statutInterne, montant, cpm_trans_status: transStatus } as Record<string, unknown>,
    ip_address: clientIp,
  })

  return NextResponse.json({ received: true })
}
