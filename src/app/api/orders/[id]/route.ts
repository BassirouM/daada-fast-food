/**
 * GET    /api/orders/[id] — Détail commande (owner ou admin)
 * PATCH  /api/orders/[id] — Changer statut (admin / livreur)
 * DELETE /api/orders/[id] — Annuler (client < 5 min | admin toujours)
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { getVerifiedPayload } from '@/services/auth/session'
import { logAudit } from '@/lib/db/audit'

type Params = { params: { id: string } }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const VALID_STATUTS = [
  'pending', 'confirmed', 'preparing',
  'ready', 'picked_up', 'delivered', 'cancelled',
] as const

type StatutCommande = typeof VALID_STATUTS[number]

const updateStatutSchema = z.object({
  statut:      z.enum(VALID_STATUTS),
  livreur_id:  z.string().uuid().optional().nullable(),
  temps_estime: z.number().int().min(1).max(240).optional().nullable(),
})

// ── Transitions autorisées par rôle ─────────────────────────────────────────

const TRANSITIONS_ADMIN: Record<StatutCommande, StatutCommande[]> = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready:     ['picked_up', 'cancelled'],
  picked_up: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

const TRANSITIONS_LIVREUR: Record<StatutCommande, StatutCommande[]> = {
  pending:   [],
  confirmed: [],
  preparing: [],
  ready:     ['picked_up'],
  picked_up: ['delivered'],
  delivered: [],
  cancelled: [],
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const payload = await getVerifiedPayload(req.headers.get('authorization'), req.cookies)
    if (!payload) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('commandes')
      .select(`
        *,
        users!commandes_client_id_fkey ( id, nom, telephone ),
        commande_articles ( id, nom, quantite, prix_unitaire, menu_id ),
        paiements ( id, methode, statut, transaction_id )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    }

    const row = data as Record<string, unknown>
    const isAdmin   = payload.role === 'admin' || payload.role === 'super_admin'
    const isOwner   = row['client_id'] === payload.sub
    const isLivreur = payload.role === 'delivery_agent' && row['livreur_id'] === payload.sub

    if (!isAdmin && !isOwner && !isLivreur) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    return NextResponse.json({ commande: data })
  } catch (err) {
    console.error('[GET /api/orders/[id]]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── PATCH — changer statut ────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const payload = await getVerifiedPayload(req.headers.get('authorization'), req.cookies)
    if (!payload) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const isAdmin   = payload.role === 'admin' || payload.role === 'super_admin'
    const isLivreur = payload.role === 'delivery_agent'

    if (!isAdmin && !isLivreur) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
    }

    const parsed = updateStatutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
    }

    const { statut: newStatut, livreur_id, temps_estime } = parsed.data
    const admin = createAdminClient()

    const { data: existing } = await admin
      .from('commandes')
      .select('statut, client_id, livreur_id')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    }

    const currentStatut = (existing as Record<string, unknown>)['statut'] as StatutCommande

    // Vérifier transitions autorisées
    const allowed = isAdmin
      ? TRANSITIONS_ADMIN[currentStatut] ?? []
      : TRANSITIONS_LIVREUR[currentStatut] ?? []

    if (!allowed.includes(newStatut)) {
      return NextResponse.json(
        { error: `Transition ${currentStatut} → ${newStatut} non autorisée` },
        { status: 422 }
      )
    }

    const updatePayload: Record<string, unknown> = {
      statut:     newStatut,
      updated_at: new Date().toISOString(),
    }
    if (livreur_id  !== undefined) updatePayload['livreur_id']   = livreur_id
    if (temps_estime !== undefined) updatePayload['temps_estime'] = temps_estime

    const { data: updated, error: updErr } = await admin
      .from('commandes')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updErr) {
      console.error('[PATCH /api/orders/[id]]', updErr)
      return NextResponse.json({ error: 'Mise à jour échouée' }, { status: 500 })
    }

    await logAudit({
      userId:    payload.sub,
      action:    `statut_commande:${currentStatut}→${newStatut}`,
      tableName: 'commandes',
      recordId:  id,
      oldData:   { statut: currentStatut },
      newData:   updatePayload,
    })

    return NextResponse.json({ commande: updated })
  } catch (err) {
    console.error('[PATCH /api/orders/[id]]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── DELETE — annuler ─────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const payload = await getVerifiedPayload(req.headers.get('authorization'), req.cookies)
    if (!payload) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const isAdmin = payload.role === 'admin' || payload.role === 'super_admin'
    const admin   = createAdminClient()

    const { data: existing } = await admin
      .from('commandes')
      .select('statut, client_id, created_at')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    }

    const row         = existing as Record<string, unknown>
    const statut      = row['statut'] as StatutCommande
    const clientId    = row['client_id'] as string
    const createdAt   = new Date(row['created_at'] as string)
    const isOwner     = clientId === payload.sub

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Déjà annulée ou livrée
    if (statut === 'cancelled') {
      return NextResponse.json({ error: 'Commande déjà annulée' }, { status: 409 })
    }
    if (statut === 'delivered') {
      return NextResponse.json({ error: 'Commande déjà livrée, annulation impossible' }, { status: 409 })
    }

    // Client ne peut annuler que dans les 5 premières minutes
    if (!isAdmin && isOwner) {
      const ageMinutes = (Date.now() - createdAt.getTime()) / 60000
      if (ageMinutes > 5) {
        return NextResponse.json(
          { error: 'Délai d\'annulation dépassé (5 minutes maximum)' },
          { status: 403 }
        )
      }
      // Client ne peut annuler que si pas encore confirmée
      if (statut !== 'pending') {
        return NextResponse.json(
          { error: 'Commande déjà en préparation, contactez le support' },
          { status: 403 }
        )
      }
    }

    const { error: cancelErr } = await admin
      .from('commandes')
      .update({ statut: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (cancelErr) {
      console.error('[DELETE /api/orders/[id]]', cancelErr)
      return NextResponse.json({ error: 'Annulation échouée' }, { status: 500 })
    }

    await logAudit({
      userId:    payload.sub,
      action:    isAdmin ? 'admin_cancel_commande' : 'client_cancel_commande',
      tableName: 'commandes',
      recordId:  id,
      oldData:   { statut },
      newData:   { statut: 'cancelled' },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/orders/[id]]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
