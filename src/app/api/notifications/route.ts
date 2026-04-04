/**
 * /api/notifications
 *
 * POST : Envoyer une notification FCM (usage interne / admin)
 * GET  : Liste les notifications de l'utilisateur connecté
 * PATCH: Marquer une (ou toutes) comme lue(s)
 *
 * Sécurité :
 *   - JWT requis
 *   - POST limité aux rôles admin / service interne (INTERNAL_API_KEY)
 *   - Rate limit : 60 req/min (GET), 20 req/min (POST/PATCH)
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { getVerifiedPayload } from '@/services/auth/session'
import { checkRateLimit } from '@/lib/security/rateLimit'
import { sendPushNotification, sendToMultiple } from '@/services/notifications/fcm'
import { enqueueNotification } from '@/lib/queue/notifications'
import type { NotificationEvent, NotificationJob } from '@/lib/queue/notifications'

export const dynamic = 'force-dynamic'

// ─── GET — liste notifications ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const payload = await getVerifiedPayload(req.headers.get('authorization'), req.cookies)
    if (!payload) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const rl = await checkRateLimit(`rl:notif:get:${payload.sub}`, 60, 60)
    if (!rl.ok) return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })

    const { searchParams } = new URL(req.url)
    const limit  = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)
    const unread = searchParams.get('unread') === 'true'

    const admin = createAdminClient()

    let query = admin
      .from('notifications')
      .select('*')
      .eq('user_id', payload.sub)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unread) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query
    if (error) throw error

    const unreadCount = (data ?? []).filter(
      (n: Record<string, unknown>) => !n['is_read']
    ).length

    return NextResponse.json({ notifications: data ?? [], unreadCount })
  } catch (err) {
    console.error('[GET /api/notifications]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── POST — envoyer notification ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Auth : JWT ou clé API interne
    const internalKey = req.headers.get('x-internal-key')
    const isInternal  = internalKey && internalKey === process.env.INTERNAL_API_KEY

    let userId: string | undefined

    if (!isInternal) {
      const payload = await getVerifiedPayload(req.headers.get('authorization'), req.cookies)
      if (!payload) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

      const role = String(payload['role'] ?? '')
      if (!['admin', 'super_admin'].includes(role)) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
      }
      userId = payload.sub
    }

    const rl = await checkRateLimit(`rl:notif:post:${userId ?? 'internal'}`, 20, 60)
    if (!rl.ok) return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })

    const body = await req.json() as {
      mode?:       'direct' | 'queue' | 'multicast'
      userId?:     string
      userIds?:    string[]
      title?:      string
      body?:       string
      data?:       Record<string, string>
      event?:      NotificationEvent
      userPhone?:  string
      userEmail?:  string
      commandeId?: string
      eventData?:  Record<string, unknown>
    }

    // Mode 1 : envoi direct FCM
    if (body.mode === 'direct' || (!body.mode && body.userId && body.title)) {
      if (!body.userId || !body.title || !body.body) {
        return NextResponse.json({ error: 'userId, title, body requis' }, { status: 400 })
      }
      const result = await sendPushNotification(
        body.userId, body.title, body.body, body.data
      )
      return NextResponse.json({ ok: true, ...result })
    }

    // Mode 2 : multicast
    if (body.mode === 'multicast') {
      if (!body.userIds?.length || !body.title || !body.body) {
        return NextResponse.json({ error: 'userIds[], title, body requis' }, { status: 400 })
      }
      const result = await sendToMultiple(body.userIds, {
        title:    body.title,
        body:     body.body,
        ...(body.data !== undefined && { data: body.data }),
      })
      return NextResponse.json({ ok: true, ...result })
    }

    // Mode 3 : queue event (recommandé pour les notifications liées aux commandes)
    if (body.mode === 'queue' || body.event) {
      if (!body.event || !body.userId) {
        return NextResponse.json({ error: 'event + userId requis' }, { status: 400 })
      }
      const notifJob: NotificationJob = {
        event:  body.event,
        userId: body.userId,
        ...(body.userPhone  !== undefined && { userPhone:  body.userPhone }),
        ...(body.userEmail  !== undefined && { userEmail:  body.userEmail }),
        ...(body.commandeId !== undefined && { commandeId: body.commandeId }),
        ...(body.eventData  !== undefined && { data:       body.eventData }),
      }
      await enqueueNotification(notifJob)
      return NextResponse.json({ ok: true, queued: true })
    }

    return NextResponse.json({ error: 'mode invalide (direct|multicast|queue)' }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/notifications]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── PATCH — marquer comme lu ─────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const payload = await getVerifiedPayload(req.headers.get('authorization'), req.cookies)
    if (!payload) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const rl = await checkRateLimit(`rl:notif:patch:${payload.sub}`, 20, 60)
    if (!rl.ok) return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })

    const body = await req.json() as { id?: string; all?: boolean }
    const admin = createAdminClient()

    if (body.all) {
      await admin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', payload.sub)
        .eq('is_read', false)

      return NextResponse.json({ ok: true, updated: 'all' })
    }

    if (!body.id) {
      return NextResponse.json({ error: 'id ou all requis' }, { status: 400 })
    }

    // Vérifier que la notification appartient à l'utilisateur
    const { data: notif } = await admin
      .from('notifications')
      .select('id, user_id')
      .eq('id', body.id)
      .single()

    const row = notif as Record<string, unknown> | null
    if (!row || row['user_id'] !== payload.sub) {
      return NextResponse.json({ error: 'Notification introuvable' }, { status: 404 })
    }

    await admin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', body.id)

    return NextResponse.json({ ok: true, updated: body.id })
  } catch (err) {
    console.error('[PATCH /api/notifications]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
