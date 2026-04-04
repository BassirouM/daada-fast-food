/**
 * GET /api/payment/status?tx=...
 * Interroge le statut d'une transaction de paiement.
 *
 * Utilisé par la page /paiement/attente pour le polling.
 * Vérifie d'abord en DB, puis interroge le provider si toujours PENDING.
 *
 * Sécurité :
 *   - Auth JWT requis
 *   - Rate limit : 30 req/min
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { getVerifiedPayload } from '@/services/auth/session'
import { checkRateLimit } from '@/lib/security/rateLimit'
import { verifierStatut as cinetpayStatut } from '@/services/payment/cinetpay'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const payload = await getVerifiedPayload(req.headers.get('authorization'), req.cookies)
    if (!payload) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Rate limit : 30 req/min
    const rl = await checkRateLimit(`rl:payment:status:${payload.sub}`, 30, 60)
    if (!rl.ok) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }

    const { searchParams } = new URL(req.url)
    const tx = searchParams.get('tx')?.trim() ?? ''

    if (!tx) {
      return NextResponse.json({ error: 'Paramètre tx manquant' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 1. Chercher le paiement en DB
    const { data: paiement } = await admin
      .from('paiements')
      .select('id, statut, transaction_id, provider')
      .eq('transaction_id', tx)
      .eq('client_id', payload.sub)
      .single()

    if (!paiement) {
      return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 })
    }

    const row = paiement as Record<string, unknown>

    // Si déjà terminé, répondre depuis la DB
    const dbStatut = String(row['statut'] ?? 'pending')
    if (dbStatut === 'completed') {
      return NextResponse.json({ statut: 'ACCEPTED' })
    }
    if (dbStatut === 'failed') {
      return NextResponse.json({ statut: 'REFUSED' })
    }
    if (dbStatut === 'cancelled') {
      return NextResponse.json({ statut: 'CANCELLED' })
    }

    // 2. Interroger le provider si encore PENDING
    const provider = String(row['provider'] ?? 'cinetpay')
    let statut: string = 'PENDING'

    try {
      if (provider === 'cinetpay' || provider === 'initiated') {
        statut = await cinetpayStatut(tx)
      }
    } catch {
      // Provider non disponible — garder PENDING
    }

    return NextResponse.json({ statut })
  } catch (err) {
    console.error('[GET /api/payment/status]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
