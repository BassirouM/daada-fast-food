/**
 * File d'attente BullMQ pour les paiements.
 *
 * Queues :
 *   - payment.process   : traitement initial d'un paiement (CinetPay → Campay fallback)
 *   - payment.confirmed : actions post-confirmation (mise à jour commande, notifs)
 *
 * Politique de retry : 3 tentatives, backoff exponentiel (2s, 4s, 8s)
 * Dead letter : jobs échoués versés dans payment.failed
 */

import type { Job } from 'bullmq';
import { Queue, Worker, QueueEvents } from 'bullmq'
import { createAdminClient } from '@/lib/supabase'
import { initierPaiement as cinetpayInit, verifierStatut as cinetpayStatut } from '@/services/payment/cinetpay'
import { initierPaiement as campayInit } from '@/services/payment/campay'
import { logAudit } from '@/lib/db/audit'

// ─── Redis connection ─────────────────────────────────────────────────────────

function getRedisConnection() {
  const url = process.env.REDIS_URL ?? process.env.UPSTASH_REDIS_REST_URL
  if (!url) {
    throw new Error('REDIS_URL ou UPSTASH_REDIS_REST_URL requis pour BullMQ')
  }

  // Support URL redis:// (BullMQ natif)
  if (url.startsWith('redis://') || url.startsWith('rediss://')) {
    const parsed = new URL(url)
    return {
      host:     parsed.hostname,
      port:     parseInt(parsed.port || '6379', 10),
      password: parsed.password || undefined,
      tls:      url.startsWith('rediss://') ? {} : undefined,
    }
  }

  // Fallback : Upstash via ioredis compatible URL
  return { host: 'localhost', port: 6379 }
}

// ─── Default job options ──────────────────────────────────────────────────────

const DEFAULT_JOB_OPTS = {
  attempts: 3,
  backoff: {
    type:  'exponential' as const,
    delay: 2000, // 2s → 4s → 8s
  },
  removeOnComplete: { count: 100 },
  removeOnFail:     { count: 500 },
}

// ─── Queue types ──────────────────────────────────────────────────────────────

export interface PaymentProcessJob {
  paiementId:      string
  commandeId:      string
  transactionId:   string
  montant:         number
  clientNom:       string
  clientTelephone: string
  methode:         'orange_money' | 'mtn_momo'
  provider:        'cinetpay' | 'campay' | 'auto'
}

export interface PaymentConfirmedJob {
  paiementId:    string
  commandeId:    string
  transactionId: string
  statut:        'ACCEPTED' | 'REFUSED' | 'CANCELLED'
  provider:      string
  montant:       number
}

// ─── Queues ───────────────────────────────────────────────────────────────────

let _processQueue:   Queue<PaymentProcessJob>   | null = null
let _confirmedQueue: Queue<PaymentConfirmedJob> | null = null
let _failedQueue:    Queue<PaymentProcessJob>   | null = null

function getConnection() {
  try {
    return getRedisConnection()
  } catch {
    return null
  }
}

export function getPaymentProcessQueue(): Queue<PaymentProcessJob> | null {
  if (_processQueue) return _processQueue
  const conn = getConnection()
  if (!conn) return null
  _processQueue = new Queue<PaymentProcessJob>('payment.process', {
    connection:      conn,
    defaultJobOptions: DEFAULT_JOB_OPTS,
  })
  return _processQueue
}

export function getPaymentConfirmedQueue(): Queue<PaymentConfirmedJob> | null {
  if (_confirmedQueue) return _confirmedQueue
  const conn = getConnection()
  if (!conn) return null
  _confirmedQueue = new Queue<PaymentConfirmedJob>('payment.confirmed', {
    connection:      conn,
    defaultJobOptions: DEFAULT_JOB_OPTS,
  })
  return _confirmedQueue
}

export function getPaymentFailedQueue(): Queue<PaymentProcessJob> | null {
  if (_failedQueue) return _failedQueue
  const conn = getConnection()
  if (!conn) return null
  _failedQueue = new Queue<PaymentProcessJob>('payment.failed', {
    connection: conn,
  })
  return _failedQueue
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export async function enqueuePaymentProcess(data: PaymentProcessJob) {
  const q = getPaymentProcessQueue()
  if (!q) {
    // Pas de Redis : traitement synchrone fallback
    console.warn('[queue] Redis non disponible, traitement paiement synchrone')
    await processPaymentJob(data)
    return
  }
  await q.add('process', data)
}

export async function enqueuePaymentConfirmed(data: PaymentConfirmedJob) {
  const q = getPaymentConfirmedQueue()
  if (!q) {
    await handlePaymentConfirmed(data)
    return
  }
  await q.add('confirmed', data)
}

// ─── Job processors ───────────────────────────────────────────────────────────

async function processPaymentJob(data: PaymentProcessJob): Promise<void> {
  const { paiementId, commandeId, transactionId, montant, clientNom, clientTelephone, methode, provider } = data
  const admin = createAdminClient()

  let paymentUrl: string | null = null
  let usedProvider = provider === 'auto' ? 'cinetpay' : provider

  try {
    if (usedProvider === 'cinetpay' || provider === 'auto') {
      const result = await cinetpayInit({ transactionId, montant, commandeId, clientNom, clientTelephone, methode })
      paymentUrl   = result.paymentUrl
      usedProvider = 'cinetpay'
    } else {
      const result = await campayInit({ transactionId, montant, commandeId, clientNom, clientTelephone, methode })
      paymentUrl   = result.paymentUrl
      usedProvider = 'campay'
    }
  } catch (cinetpayErr) {
    console.error('[queue] CinetPay failed, trying Campay:', cinetpayErr)

    if (provider === 'auto') {
      const result = await campayInit({ transactionId, montant, commandeId, clientNom, clientTelephone, methode })
      paymentUrl   = result.paymentUrl
      usedProvider = 'campay'
    } else {
      throw cinetpayErr
    }
  }

  // Mettre à jour le paiement avec l'URL et le provider
  await admin
    .from('paiements')
    .update({
      payment_url: paymentUrl,
      provider:    usedProvider,
      statut:      'initiated',
      updated_at:  new Date().toISOString(),
    })
    .eq('id', paiementId)

  await logAudit({
    userId:    'system',
    action:    `payment_initiated:${usedProvider}`,
    tableName: 'paiements',
    recordId:  paiementId,
    newData:   { transactionId, montant, provider: usedProvider },
  })
}

async function handlePaymentConfirmed(data: PaymentConfirmedJob): Promise<void> {
  const { paiementId, commandeId, transactionId, statut, provider, montant } = data
  const admin    = createAdminClient()
  const isAccepted = statut === 'ACCEPTED'

  // 1. Mettre à jour le paiement
  await admin
    .from('paiements')
    .update({
      statut:         isAccepted ? 'completed' : 'failed',
      transaction_id: transactionId,
      updated_at:     new Date().toISOString(),
      completed_at:   new Date().toISOString(),
    })
    .eq('id', paiementId)

  // 2. Mettre à jour la commande
  if (isAccepted) {
    await admin
      .from('commandes')
      .update({ statut: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', commandeId)
  }

  await logAudit({
    userId:    'system',
    action:    `payment_${statut.toLowerCase()}:${provider}`,
    tableName: 'paiements',
    recordId:  paiementId,
    newData:   { transactionId, statut, montant, commandeId },
  })
}

// ─── Workers (à démarrer dans un processus dédié) ─────────────────────────────

export function startPaymentWorkers() {
  const conn = getConnection()
  if (!conn) {
    console.warn('[queue] Redis non disponible, workers non démarrés')
    return
  }

  const processWorker = new Worker<PaymentProcessJob>(
    'payment.process',
    async (job: Job<PaymentProcessJob>) => {
      await processPaymentJob(job.data)
    },
    {
      connection:  conn,
      concurrency: 5,
    }
  )

  processWorker.on('failed', async (job, err) => {
    console.error(`[queue] payment.process job ${job?.id} failed:`, err)

    // Envoyer dans la dead letter queue après épuisement des tentatives
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      const dlq = getPaymentFailedQueue()
      if (dlq && job.data) {
        await dlq.add('dead_letter', job.data)
      }
    }
  })

  const confirmedWorker = new Worker<PaymentConfirmedJob>(
    'payment.confirmed',
    async (job: Job<PaymentConfirmedJob>) => {
      await handlePaymentConfirmed(job.data)
    },
    {
      connection:  conn,
      concurrency: 10,
    }
  )

  confirmedWorker.on('failed', (job, err) => {
    console.error(`[queue] payment.confirmed job ${job?.id} failed:`, err)
  })

  return { processWorker, confirmedWorker }
}

// ─── QueueEvents (monitoring) ─────────────────────────────────────────────────

export function createPaymentQueueEvents() {
  const conn = getConnection()
  if (!conn) return null

  return {
    process:   new QueueEvents('payment.process',   { connection: conn }),
    confirmed: new QueueEvents('payment.confirmed', { connection: conn }),
  }
}

// ─── Polling statut (pour la page d'attente sans webhook) ────────────────────

export async function pollPaymentStatut(transactionId: string): Promise<'ACCEPTED' | 'REFUSED' | 'CANCELLED' | 'PENDING'> {
  try {
    return await cinetpayStatut(transactionId)
  } catch {
    return 'PENDING'
  }
}
