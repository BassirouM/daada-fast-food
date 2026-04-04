/**
 * POST /api/orders/[id]/rate
 *
 * Soumet une note (1-5 étoiles) pour une commande livrée.
 * Met à jour note_moyenne dans la table menus pour chaque article.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { getVerifiedPayload } from '@/services/auth/session'

type Params = { params: { id: string } }
type RateBody = { note: number; commentaire?: string }

export async function POST(request: NextRequest, { params }: Params) {
  const { id: commandeId } = params

  // Auth
  const payload = await getVerifiedPayload(request.headers.get('authorization'), request.cookies)
  if (!payload) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body: RateBody
  try {
    body = await request.json() as RateBody
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  const { note } = body
  if (!note || note < 1 || note > 5) {
    return NextResponse.json({ error: 'Note invalide (1-5)' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Vérifier que la commande appartient à l'utilisateur et est livrée
  const { data: commande } = await supabase
    .from('commandes')
    .select('id, client_id, statut')
    .eq('id', commandeId)
    .single()

  if (!commande) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
  if (commande.client_id !== payload.sub) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  // Récupérer les articles de la commande
  const { data: articles } = await supabase
    .from('commande_articles')
    .select('menu_id')
    .eq('commande_id', commandeId)

  if (!articles?.length) return NextResponse.json({ success: true })

  // Mettre à jour note_moyenne pour chaque plat
  const menuIds = [...new Set(articles.map((a) => a.menu_id as string))]

  for (const menuId of menuIds) {
    const { data: menu } = await supabase
      .from('menus')
      .select('note_moyenne, nb_commandes')
      .eq('id', menuId)
      .single()

    if (!menu) continue

    const count     = Math.max(1, menu.nb_commandes as number)
    const oldNote   = menu.note_moyenne as number
    const newNote   = Math.min(5, Math.max(1, (oldNote * (count - 1) + note) / count))

    await supabase
      .from('menus')
      .update({ note_moyenne: Math.round(newNote * 10) / 10 })
      .eq('id', menuId)
  }

  // Audit
  await supabase.from('audit_log').insert({
    user_id:    payload.sub,
    action:     'order_rated',
    table_name: 'commandes',
    record_id:  commandeId,
    new_data:   { note, commentaire: body.commentaire } as Record<string, unknown>,
  })

  return NextResponse.json({ success: true })
}
