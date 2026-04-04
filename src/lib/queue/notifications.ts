/**
 * Queue BullMQ — notifications
 *
 * Queue "notification.send" :
 *   - Consomme les events order.*
 *   - Détermine les canaux selon le type d'événement
 *   - Retry automatique x3 (backoff exponentiel 2s/4s/8s)
 *   - Dead letter queue pour les échecs définitifs
 *
 * Events supportés :
 *   order.created   → Push
 *   order.paid      → Push
 *   order.ready     → Push + SMS (fallback 30s)
 *   order.delivered → Push + Email
 *   payment.failed  → Push + SMS immédiat
 *   promo.daily     → Push opt-in
 */

import type { Job } from 'bullmq';
import { Queue, Worker, QueueEvents } from 'bullmq'
import { sendPushNotification } from '@/services/notifications/fcm'
import { sendEmail }            from '@/services/notifications/email'
import { sendSms, sendSmsWithPushFallback } from '@/services/notifications/sms'
import { createAdminClient }    from '@/lib/supabase'
import type { OrderConfirmationData, OrderDeliveredData } from '@/services/notifications/email'

// ─── Redis connection ─────────────────────────────────────────────────────────

function getRedisConnection() {
  const url = process.env.REDIS_URL ?? ''
  if (url.startsWith('redis://') || url.startsWith('rediss://')) {
    const parsed = new URL(url)
    return {
      host:     parsed.hostname,
      port:     parseInt(parsed.port || '6379', 10),
      password: parsed.password || undefined,
      tls:      url.startsWith('rediss://') ? {} : undefined,
    }
  }
  return { host: 'localhost', port: 6379 }
}

// ─── Job types ────────────────────────────────────────────────────────────────

export type NotificationEvent =
  | 'order.created'
  | 'order.paid'
  | 'order.ready'
  | 'order.delivered'
  | 'payment.failed'
  | 'promo.daily'

export interface NotificationJob {
  event:       NotificationEvent
  userId:      string
  userPhone?:  string
  userEmail?:  string
  commandeId?: string
  data?:       Record<string, unknown>
}

// ─── Default options ──────────────────────────────────────────────────────────

const DEFAULT_JOB_OPTS = {
  attempts: 3,
  backoff: {
    type:  'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: { count: 200 },
  removeOnFail:     { count: 500 },
}

// ─── Queue singleton ──────────────────────────────────────────────────────────

let _notifQueue: Queue<NotificationJob> | null = null
let _dlq:        Queue<NotificationJob> | null = null

function getConn() {
  try { return getRedisConnection() } catch { return null }
}

export function getNotificationQueue(): Queue<NotificationJob> | null {
  if (_notifQueue) return _notifQueue
  const conn = getConn()
  if (!conn) return null
  _notifQueue = new Queue<NotificationJob>('notification.send', {
    connection:        conn,
    defaultJobOptions: DEFAULT_JOB_OPTS,
  })
  return _notifQueue
}

export function getNotificationDLQ(): Queue<NotificationJob> | null {
  if (_dlq) return _dlq
  const conn = getConn()
  if (!conn) return null
  _dlq = new Queue<NotificationJob>('notification.failed', { connection: conn })
  return _dlq
}

// ─── enqueue ──────────────────────────────────────────────────────────────────

export async function enqueueNotification(job: NotificationJob): Promise<void> {
  const q = getNotificationQueue()
  if (!q) {
    // Pas de Redis : traitement synchrone
    console.warn('[notif-queue] Redis non disponible, traitement synchrone')
    await processNotificationJob(job)
    return
  }
  await q.add(job.event, job)
}

// ─── Processor ────────────────────────────────────────────────────────────────

async function processNotificationJob(job: NotificationJob): Promise<void> {
  const { event, userId, userPhone, userEmail, commandeId, data } = job
  const shortId = commandeId?.slice(0, 8).toUpperCase() ?? ''
  const admin   = createAdminClient()

  // Sauvegarder la notification in-app
  async function saveInApp(title: string, body: string, type: string) {
    await admin.from('notifications').insert({
      user_id:    userId,
      type,
      title,
      body,
      data:       { commandeId, ...data } as Record<string, string>,
      is_read:    false,
      created_at: new Date().toISOString(),
    })
  }

  switch (event) {
    case 'order.created': {
      const title = `✅ Commande reçue #${shortId}`
      const body  = 'Votre commande a bien été reçue. Paiement en attente.'
      await saveInApp(title, body, 'order_confirmed')
      await sendPushNotification(userId, title, body, {
        commandeId: commandeId ?? '',
        click_action: `/orders/${commandeId}`,
      })
      break
    }

    case 'order.paid': {
      const title = '👨‍🍳 En préparation'
      const body  = `Commande #${shortId} confirmée ! Notre cuisine s'en occupe.`
      await saveInApp(title, body, 'order_preparing')
      await sendPushNotification(userId, title, body, {
        commandeId: commandeId ?? '',
        click_action: `/orders/${commandeId}`,
      })
      // Email de confirmation si disponible
      if (userEmail && data?.articles) {
        sendEmail(userEmail, {
          type: 'orderConfirmation',
          data: data as unknown as OrderConfirmationData,
        }).catch(console.error)
      }
      break
    }

    case 'order.ready': {
      const eta   = (data?.eta as number | undefined) ?? 10
      const title = '🛵 Livreur en route !'
      const body  = `Votre commande #${shortId} est en chemin. Arrivée ~${eta} min.`
      await saveInApp(title, body, 'order_picked_up')
      await sendPushNotification(userId, title, body, {
        commandeId: commandeId ?? '',
        click_action: `/orders/${commandeId}`,
      })
      // SMS fallback après 30s si le push n'a pas été confirmé
      if (userPhone) {
        sendSmsWithPushFallback(userPhone, 'livreur_en_route', {
          ...(commandeId !== undefined && { commandeId }),
          eta,
        }, 30_000).catch(console.error)
      }
      break
    }

    case 'order.delivered': {
      const title = '🎉 Commande livrée !'
      const body  = `Commande #${shortId} livrée. Bon appétit !`
      await saveInApp(title, body, 'order_delivered')
      await sendPushNotification(userId, title, body, {
        commandeId: commandeId ?? '',
        click_action: `/orders/${commandeId}?rate=1`,
      })
      // Email avec facture
      if (userEmail && data) {
        sendEmail(userEmail, {
          type: 'orderDelivered',
          data: data as unknown as OrderDeliveredData,
        }).catch(console.error)
      }
      break
    }

    case 'payment.failed': {
      const title = '❌ Paiement échoué'
      const body  = `Le paiement pour la commande #${shortId} a échoué. Réessayez.`
      await saveInApp(title, body, 'payment_failed')
      await sendPushNotification(userId, title, body, {
        commandeId: commandeId ?? '',
        click_action: '/checkout',
      })
      // SMS immédiat (critique)
      if (userPhone) {
        sendSms(userPhone, 'paiement_echoue', {
          ...(commandeId !== undefined && { commandeId }),
        }).catch(console.error)
      }
      break
    }

    case 'promo.daily': {
      const title = (data?.title as string | undefined) ?? '🔥 Offre du jour Daada'
      const body  = (data?.body  as string | undefined) ?? '-20% sur toutes les commandes aujourd\'hui !'
      // Uniquement les utilisateurs opt-in (vérifier préférence)
      const { data: prefs } = await admin
        .from('users')
        .select('notifications_promo')
        .eq('id', userId)
        .single()
      const row = prefs as Record<string, unknown> | null
      if (!row?.['notifications_promo']) break

      await saveInApp(title, body, 'promotion')
      await sendPushNotification(userId, title, body, {
        click_action: '/menu',
      })
      break
    }
  }
}

// ─── Worker ───────────────────────────────────────────────────────────────────

export function startNotificationWorker() {
  const conn = getConn()
  if (!conn) {
    console.warn('[notif-queue] Redis non disponible, worker non démarré')
    return null
  }

  const worker = new Worker<NotificationJob>(
    'notification.send',
    async (job: Job<NotificationJob>) => {
      await processNotificationJob(job.data)
    },
    {
      connection:  conn,
      concurrency: 20,
    }
  )

  worker.on('failed', async (job, err) => {
    console.error(`[notif-queue] job ${job?.id} failed:`, err)
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      const dlq = getNotificationDLQ()
      if (dlq && job.data) await dlq.add('dead_letter', job.data)
    }
  })

  return worker
}

export function createNotificationQueueEvents() {
  const conn = getConn()
  if (!conn) return null
  return new QueueEvents('notification.send', { connection: conn })
}
