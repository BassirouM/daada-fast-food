/**
 * GET  /api/menu/[id]  — Détail d'un plat (public)
 * PATCH /api/menu/[id] — Modifier un plat (admin)
 * DELETE /api/menu/[id] — Soft delete (admin)
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase, createAdminClient } from '@/lib/supabase'
import { getVerifiedPayload } from '@/services/auth/session'
import { checkRateLimit } from '@/lib/security/rateLimit'
import { logAudit } from '@/lib/db/audit'

type Params = { params: { id: string } }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const updatePlatSchema = z.object({
  nom:               z.string().trim().min(2).max(200).optional(),
  description:       z.string().trim().max(1000).optional(),
  prix:              z.number().int().min(100).optional(),
  categorie:         z.string().trim().min(2).max(100).optional(),
  image_url:         z.string().url().nullable().optional(),
  disponible:        z.boolean().optional(),
  temps_preparation: z.number().int().min(1).max(120).optional(),
  tags:              z.array(z.string().trim().max(50)).max(10).optional(),
})

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = params

    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Plat introuvable' }, { status: 404 })
    }

    return NextResponse.json(
      { plat: data },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } }
    )
  } catch (err) {
    console.error('[GET /api/menu/[id]]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const payload = await getVerifiedPayload(req.headers.get('authorization'), req.cookies)
    if (!payload) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (payload.role !== 'admin' && payload.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const rl = await checkRateLimit(`rl:menu:patch:${ip}`, 60, 300)
    if (!rl.ok) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }

    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
    }

    const result = updatePlatSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 422 })
    }

    if (Object.keys(result.data).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à modifier' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Récupérer ancienne valeur pour audit
    const { data: old } = await admin.from('menus').select('*').eq('id', id).single()
    if (!old) return NextResponse.json({ error: 'Plat introuvable' }, { status: 404 })

    const { data, error } = await admin
      .from('menus')
      .update(result.data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[PATCH /api/menu/[id]]', error)
      return NextResponse.json({ error: 'Modification échouée' }, { status: 500 })
    }

    await logAudit({
      userId:    payload.sub,
      action:    'update_plat',
      tableName: 'menus',
      recordId:  id,
      oldData:   old as Record<string, unknown>,
      newData:   result.data as Record<string, unknown>,
    })

    return NextResponse.json({ plat: data })
  } catch (err) {
    console.error('[PATCH /api/menu/[id]]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── DELETE — soft delete ──────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const payload = await getVerifiedPayload(req.headers.get('authorization'), req.cookies)
    if (!payload) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (payload.role !== 'admin' && payload.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const admin = createAdminClient()

    const { data: existing } = await admin
      .from('menus').select('id, nom').eq('id', id).single()
    if (!existing) {
      return NextResponse.json({ error: 'Plat introuvable' }, { status: 404 })
    }

    // Soft delete : disponible = false
    const { error } = await admin
      .from('menus')
      .update({ disponible: false })
      .eq('id', id)

    if (error) {
      console.error('[DELETE /api/menu/[id]]', error)
      return NextResponse.json({ error: 'Suppression échouée' }, { status: 500 })
    }

    await logAudit({
      userId:    payload.sub,
      action:    'soft_delete_plat',
      tableName: 'menus',
      recordId:  id,
      oldData:   { disponible: true },
      newData:   { disponible: false },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/menu/[id]]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
