/**
 * POST /api/orders — Créer une commande
 *   - Auth obligatoire
 *   - Recalcul total côté serveur (prix depuis DB)
 *   - Vérification disponibilité plats
 *
 * GET  /api/orders — Liste commandes (admin, pagination cursor)
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { getVerifiedPayload } from '@/services/auth/session'
import { checkRateLimit } from '@/lib/security/rateLimit'
import { logAudit } from '@/lib/db/audit'

const FRAIS_LIVRAISON_DEFAULT = 500

// ─── Schémas ──────────────────────────────────────────────────────────────────

const articleInputSchema = z.object({
  menu_id:  z.string().uuid('menu_id invalide'),
  quantite: z.number().int().min(1).max(20),
})

const createOrderSchema = z.object({
  articles:         z.array(articleInputSchema).min(1).max(30),
  adresse_livraison: z.string().trim().min(10).max(500),
  frais_livraison:   z.number().int().min(0).max(5000).default(FRAIS_LIVRAISON_DEFAULT),
  note_cuisinier:    z.string().trim().max(500).optional(),
})

// ─── POST — créer commande ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Auth
    const payload = await getVerifiedPayload(req.headers.get('authorization'), req.cookies)
    if (!payload) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Rate limit : 5 commandes / 10 min par client
    const rl = await checkRateLimit(`rl:orders:create:${payload.sub}`, 5, 600)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Trop de commandes en peu de temps. Réessayez dans quelques minutes.' },
        { status: 429 }
      )
    }

    // Validation body
    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
    }

    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
    }

    const { articles, adresse_livraison, frais_livraison, note_cuisinier } = parsed.data
    const admin = createAdminClient()

    // ── Vérification disponibilité + recalcul prix ────────────────────────────
    const menuIds = [...new Set(articles.map((a) => a.menu_id))]

    const { data: menus, error: menuErr } = await admin
      .from('menus')
      .select('id, nom, prix, disponible')
      .in('id', menuIds)

    if (menuErr) {
      return NextResponse.json({ error: 'Erreur récupération menu' }, { status: 500 })
    }

    const menuMap = new Map(
      ((menus ?? []) as Array<{ id: string; nom: string; prix: number; disponible: boolean }>)
        .map((m) => [m.id, m])
    )

    // Vérifier que tous les plats existent et sont disponibles
    const indisponibles: string[] = []
    const introuvables: string[]  = []

    for (const a of articles) {
      const menu = menuMap.get(a.menu_id)
      if (!menu) { introuvables.push(a.menu_id); continue }
      if (!menu.disponible) indisponibles.push(menu.nom)
    }

    if (introuvables.length > 0) {
      return NextResponse.json(
        { error: `Plats introuvables : ${introuvables.join(', ')}` },
        { status: 422 }
      )
    }

    if (indisponibles.length > 0) {
      return NextResponse.json(
        { error: `Plats indisponibles : ${indisponibles.join(', ')}` },
        { status: 422 }
      )
    }

    // Recalcul sous-total avec les prix de la DB (jamais depuis le client)
    const lignes = articles.map((a) => {
      const menu = menuMap.get(a.menu_id)!
      return {
        menu_id:       a.menu_id,
        nom:           menu.nom,
        quantite:      a.quantite,
        prix_unitaire: menu.prix,
      }
    })

    const sous_total = lignes.reduce((acc, l) => acc + l.prix_unitaire * l.quantite, 0)
    const total      = sous_total + frais_livraison

    // ── Créer la commande ─────────────────────────────────────────────────────
    const { data: commande, error: cmdErr } = await admin
      .from('commandes')
      .insert({
        client_id:         payload.sub,
        adresse_livraison,
        sous_total,
        frais_livraison,
        total,
        statut:            'pending',
        note_cuisinier:    note_cuisinier ?? null,
        livreur_id:        null,
        temps_estime:      null,
        updated_at:        new Date().toISOString(),
      })
      .select()
      .single()

    if (cmdErr || !commande) {
      console.error('[POST /api/orders] commande:', cmdErr)
      return NextResponse.json({ error: 'Création commande échouée' }, { status: 500 })
    }

    // ── Insérer les articles ──────────────────────────────────────────────────
    const { error: artErr } = await admin
      .from('commande_articles')
      .insert(
        lignes.map((l) => ({ ...l, commande_id: (commande as { id: string }).id }))
      )

    if (artErr) {
      console.error('[POST /api/orders] articles:', artErr)
      // Rollback la commande
      await admin.from('commandes').delete().eq('id', (commande as { id: string }).id)
      return NextResponse.json({ error: 'Création articles échouée' }, { status: 500 })
    }

    // Incrémenter nb_commandes sur chaque plat (best-effort)
    for (const id of menuIds) {
      const current = menuMap.get(id)
      if (!current) continue
      await admin
        .from('menus')
        .update({ nb_commandes: (current as { nb_commandes?: number }).nb_commandes ?? 0 + 1 })
        .eq('id', id)
    }

    await logAudit({
      userId:    payload.sub,
      action:    'create_commande',
      tableName: 'commandes',
      recordId:  (commande as { id: string }).id,
      newData:   { total, sous_total, frais_livraison, articles: lignes.length },
    })

    return NextResponse.json({ commande }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/orders]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── GET — liste admin (cursor pagination) ────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const payload = await getVerifiedPayload(req.headers.get('authorization'), req.cookies)
    if (!payload) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    if (payload.role !== 'admin' && payload.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const limit  = Math.min(100, parseInt(searchParams.get('limit')  ?? '20', 10))
    const cursor = searchParams.get('cursor') // ISO date string (created_at du dernier élément)
    const statut = searchParams.get('statut') ?? ''

    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = admin
      .from('commandes')
      .select(`
        id, statut, total, sous_total, frais_livraison, adresse_livraison,
        created_at, updated_at, livreur_id,
        users!commandes_client_id_fkey ( id, nom, telephone )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (statut) query = query.eq('statut', statut)
    if (cursor)  query = query.lt('created_at', cursor)

    const { data, error, count } = await query

    if (error) {
      console.error('[GET /api/orders]', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    const rows = (data ?? []) as Array<Record<string, unknown>>
    const nextCursor = rows.length === limit
      ? (rows[rows.length - 1]?.['created_at'] as string | undefined) ?? null
      : null

    return NextResponse.json({
      commandes:  rows,
      total:      count ?? 0,
      nextCursor,
    })
  } catch (err) {
    console.error('[GET /api/orders]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
