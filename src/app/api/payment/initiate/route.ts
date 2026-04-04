/**
 * POST /api/payment/initiate
 *
 * Sécurité :
 *   - JWT requis (getVerifiedPayload)
 *   - Rate limit : 10 req/min (Upstash Redis, géré par middleware)
 *   - Idempotency key : empêche les doubles soumissions
 *   - Prix RECALCULÉS depuis Supabase — le client ne peut pas modifier les montants
 *
 * Flow :
 *   1. Vérifier auth + idempotency key
 *   2. Recalculer total depuis Supabase (table menus)
 *   3. Créer commande + commande_articles
 *   4. Créer paiement en DB
 *   5. Appeler CinetPay API v2
 *   6. Retourner URL de redirection CinetPay
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { getVerifiedPayload } from '@/services/auth/session'
import { Redis } from '@upstash/redis'

// ─── Config ───────────────────────────────────────────────────────────────────

const CINETPAY_API_URL        = 'https://api-checkout.cinetpay.com/v2/payment'
const CINETPAY_API_KEY        = process.env.CINETPAY_API_KEY ?? ''
const CINETPAY_SITE_ID        = process.env.CINETPAY_SITE_ID ?? ''
const APP_URL                 = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const FRAIS_LIVRAISON_DEFAULT = 500

const FRAIS_PAR_QUARTIER: Record<string, number> = {
  Domayo: 500, Kakataré: 500, Doualaré: 500,
  Kongola: 600, Lopéré: 600, 'Ouro-Tchédé': 600, Founangué: 600,
  Pitoare: 700, Dougoy: 700, Autres: 700,
}

// ─── Redis (idempotency) ──────────────────────────────────────────────────────

const redis = (() => {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
})()

// ─── Types ────────────────────────────────────────────────────────────────────

type ArticleInput = { menuId: string; quantite: number }

type CheckoutBody = {
  articles:          ArticleInput[]
  adresseLivraison:  string
  quartier:          string
  telephone:         string
  noteCuisinier?:    string
  methode:           'mtn_momo' | 'orange_money'
  telephonePaiement?: string
  idempotencyKey:    string
}

type IdempotencyResult = { redirectUrl: string; commandeId: string }

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Auth
  const payload = await getVerifiedPayload(request.headers.get('authorization'), request.cookies)
  if (!payload) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // 2. Parse body
  let body: CheckoutBody
  try {
    body = await request.json() as CheckoutBody
  } catch {
    return NextResponse.json({ error: 'Corps de la requête invalide' }, { status: 400 })
  }

  const { articles, adresseLivraison, quartier, telephone, noteCuisinier, methode, telephonePaiement, idempotencyKey } = body

  if (!articles?.length || !adresseLivraison || !quartier || !telephone || !idempotencyKey) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  // 3. Idempotency check
  if (redis) {
    try {
      const cached = await redis.get<IdempotencyResult>(`idem:${idempotencyKey}`)
      if (cached) return NextResponse.json(cached)
    } catch { /* Redis indisponible */ }
  }

  const supabase  = createAdminClient()
  const clientIp  = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

  // 4. Recalculer prix depuis Supabase (sécurité : ignorer les prix envoyés par le client)
  const { data: menus, error: menuError } = await supabase
    .from('menus')
    .select('id, prix, disponible, nom')
    .in('id', articles.map((a) => a.menuId))

  if (menuError || !menus?.length) {
    return NextResponse.json({ error: 'Articles introuvables' }, { status: 400 })
  }

  const menuMap = new Map(
    (menus as Array<{ id: string; prix: number; disponible: boolean; nom: string }>)
      .map((m) => [m.id, m])
  )

  let sousTotal = 0
  const articlesAvecPrix: Array<{ menu_id: string; nom: string; quantite: number; prix_unitaire: number }> = []

  for (const article of articles) {
    const menu = menuMap.get(article.menuId)
    if (!menu)          return NextResponse.json({ error: `Article introuvable : ${article.menuId}` }, { status: 400 })
    if (!menu.disponible) return NextResponse.json({ error: `"${menu.nom}" n'est plus disponible` }, { status: 400 })
    if (article.quantite < 1 || article.quantite > 50) return NextResponse.json({ error: `Quantité invalide pour "${menu.nom}"` }, { status: 400 })

    sousTotal += menu.prix * article.quantite
    articlesAvecPrix.push({ menu_id: article.menuId, nom: menu.nom, quantite: article.quantite, prix_unitaire: menu.prix })
  }

  const fraisLivraison = FRAIS_PAR_QUARTIER[quartier] ?? FRAIS_LIVRAISON_DEFAULT
  const total          = sousTotal + fraisLivraison

  // 5. Créer commande
  const { data: commande, error: commandeError } = await supabase
    .from('commandes')
    .insert({
      client_id:         payload.sub,
      adresse_livraison: `${quartier} — ${adresseLivraison}`,
      frais_livraison:   fraisLivraison,
      sous_total:        sousTotal,
      total,
      note_cuisinier:    noteCuisinier ?? null,
      statut:            'pending',
    })
    .select()
    .single()

  if (commandeError || !commande) {
    console.error('[Payment] Erreur création commande:', commandeError)
    return NextResponse.json({ error: 'Erreur création commande' }, { status: 500 })
  }

  const commandeId = commande.id as string

  // 6. Créer articles
  await supabase.from('commande_articles').insert(
    articlesAvecPrix.map((a) => ({ commande_id: commandeId, ...a }))
  )

  // 7. Créer paiement
  const transactionId = `TXN-${commandeId.slice(0, 8)}-${Date.now()}`

  const { data: paiement } = await supabase
    .from('paiements')
    .insert({
      commande_id:     commandeId,
      idempotency_key: idempotencyKey,
      methode,
      montant:         total,
      statut:          'pending',
      transaction_id:  transactionId,
    })
    .select()
    .single()

  // 8. Appeler CinetPay API v2
  let redirectUrl = `${APP_URL}/paiement/succes?commande_id=${commandeId}&test=1`

  if (CINETPAY_API_KEY && CINETPAY_SITE_ID) {
    try {
      const cinetpayRes = await fetch(CINETPAY_API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey:                CINETPAY_API_KEY,
          site_id:               CINETPAY_SITE_ID,
          transaction_id:        transactionId,
          amount:                total,
          currency:              'XAF',
          description:           `Commande Daada #${commandeId.slice(0, 8)}`,
          notify_url:            `${APP_URL}/api/payment/webhook`,
          return_url:            `${APP_URL}/paiement/succes?commande_id=${commandeId}`,
          cancel_url:            `${APP_URL}/paiement/echec?commande_id=${commandeId}`,
          channels:              'MOBILE_MONEY',
          customer_phone_number: telephonePaiement ?? telephone,
          customer_name:         'Client',
          customer_surname:      'Daada',
          customer_email:        `${payload.sub}@daada.cm`,
          customer_address:      adresseLivraison,
          customer_city:         'Maroua',
          customer_country:      'CM',
          customer_state:        'CM',
          customer_zip_code:     '00000',
          metadata:              JSON.stringify({ commande_id: commandeId, user_id: payload.sub }),
        }),
      })

      const cinetpayData = await cinetpayRes.json() as {
        code?: string
        data?: { payment_url?: string }
      }

      if (paiement) {
        await supabase.from('paiements').update({
          statut:        'processing',
          cinetpay_data: cinetpayData as Record<string, unknown>,
        }).eq('id', paiement.id)
      }

      if (cinetpayData.data?.payment_url) {
        redirectUrl = cinetpayData.data.payment_url
      }
    } catch (err) {
      console.error('[Payment] Erreur CinetPay:', err)
    }
  }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id:    payload.sub,
    action:     'payment_initiated',
    table_name: 'paiements',
    record_id:  paiement?.id ?? null,
    new_data:   { commande_id: commandeId, montant: total, methode } as Record<string, unknown>,
    ip_address: clientIp,
  })

  const result: IdempotencyResult = { redirectUrl, commandeId }

  if (redis) {
    try { await redis.set(`idem:${idempotencyKey}`, result, { ex: 3600 }) } catch { /* ignorer */ }
  }

  return NextResponse.json(result)
}
