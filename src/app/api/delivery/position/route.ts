/**
 * PATCH /api/delivery/position
 * Met à jour la position GPS du livreur authentifié.
 *
 * Sécurité :
 *   - Auth JWT requis, rôle delivery_agent uniquement
 *   - Validation latitude/longitude stricte
 *   - Rate limit : 60 updates/min (GPS toutes les secondes max)
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { getVerifiedPayload } from '@/services/auth/session'
import { checkRateLimit } from '@/lib/security/rateLimit'

// Bounding box Cameroun (approximatif)
const positionSchema = z.object({
  latitude:   z.number().min(-5, 'Latitude hors Cameroun').max(14, 'Latitude hors Cameroun'),
  longitude:  z.number().min(8,  'Longitude hors Cameroun').max(17, 'Longitude hors Cameroun'),
  disponible: z.boolean().optional(),
})

export async function PATCH(req: NextRequest) {
  try {
    // Auth
    const payload = await getVerifiedPayload(req.headers.get('authorization'), req.cookies)
    if (!payload) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (payload.role !== 'delivery_agent') {
      return NextResponse.json({ error: 'Réservé aux livreurs' }, { status: 403 })
    }

    // Rate limit : 60 req/min par livreur
    const rl = await checkRateLimit(`rl:gps:${payload.sub}`, 60, 60)
    if (!rl.ok) {
      return NextResponse.json({ error: 'Trop de mises à jour GPS' }, { status: 429 })
    }

    // Validation
    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
    }

    const parsed = positionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
    }

    const { latitude, longitude, disponible } = parsed.data
    const admin = createAdminClient()

    const updateData: Record<string, unknown> = {
      latitude,
      longitude,
      updated_at: new Date().toISOString(),
    }
    if (disponible !== undefined) updateData['disponible'] = disponible

    // Upsert : crée la ligne si elle n'existe pas
    const { error } = await admin
      .from('positions_livreurs')
      .upsert(
        { livreur_id: payload.sub, ...updateData },
        { onConflict: 'livreur_id' }
      )

    if (error) {
      console.error('[PATCH /api/delivery/position]', error)
      return NextResponse.json({ error: 'Mise à jour position échouée' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      position: { latitude, longitude, updated_at: updateData['updated_at'] },
    })
  } catch (err) {
    console.error('[PATCH /api/delivery/position]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
