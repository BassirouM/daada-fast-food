/**
 * Service FCM — Firebase Cloud Messaging (serveur)
 *
 * Utilise Firebase Admin SDK côté serveur uniquement (API routes / workers).
 * Ne jamais importer ce fichier dans du code client.
 *
 * Fonctions :
 *   - sendPushNotification(userId, title, body, data)
 *   - sendToMultiple(userIds[], notification)
 * Gestion auto des tokens invalides (suppression en DB).
 */

import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import type { MulticastMessage } from 'firebase-admin/messaging'
import { createAdminClient } from '@/lib/supabase'
import { logAudit } from '@/lib/db/audit'

// ─── Firebase Admin init (singleton) ─────────────────────────────────────────

function getAdminApp() {
  if (getApps().length > 0) return getApp()

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

  if (!privateKey || !clientEmail || !projectId) {
    throw new Error('Variables Firebase Admin manquantes (FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_CLIENT_EMAIL, NEXT_PUBLIC_FIREBASE_PROJECT_ID)')
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PushNotificationPayload {
  title:        string
  body:         string
  data?:        Record<string, string> | undefined
  imageUrl?:    string | undefined
  clickAction?: string | undefined
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getTokensForUser(userId: string): Promise<string[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId)

  if (!data) return []
  return (data as Array<{ token: string }>).map((r) => r.token).filter(Boolean)
}

async function removeInvalidTokens(tokens: string[]): Promise<void> {
  if (!tokens.length) return
  const admin = createAdminClient()
  await admin.from('push_tokens').delete().in('token', tokens)
}

// ─── sendPushNotification ─────────────────────────────────────────────────────

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<{ sent: number; failed: number }> {
  const tokens = await getTokensForUser(userId)
  if (!tokens.length) return { sent: 0, failed: 0 }

  return sendToTokens(tokens, { title, body, data }, userId)
}

// ─── sendToMultiple ───────────────────────────────────────────────────────────

export async function sendToMultiple(
  userIds: string[],
  notification: PushNotificationPayload,
): Promise<{ sent: number; failed: number }> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('push_tokens')
    .select('token')
    .in('user_id', userIds)

  const tokens = (data as Array<{ token: string }> | null)
    ?.map((r) => r.token)
    .filter(Boolean) ?? []

  if (!tokens.length) return { sent: 0, failed: 0 }

  return sendToTokens(tokens, notification)
}

// ─── sendToTokens (core) ─────────────────────────────────────────────────────

async function sendToTokens(
  tokens: string[],
  notification: PushNotificationPayload,
  userId?: string,
): Promise<{ sent: number; failed: number }> {
  try {
    const app = getAdminApp()
    const messaging = getMessaging(app)

    // Envoyer par batch de 500 (limite FCM)
    const BATCH = 500
    let totalSent = 0
    let totalFailed = 0
    const invalidTokens: string[] = []

    for (let i = 0; i < tokens.length; i += BATCH) {
      const batch = tokens.slice(i, i + BATCH)

      const message: MulticastMessage = {
        tokens: batch,
        notification: {
          title: notification.title,
          body:  notification.body,
          ...(notification.imageUrl !== undefined && { imageUrl: notification.imageUrl }),
        },
        data: notification.data ?? {},
        webpush: {
          notification: {
            title:  notification.title,
            body:   notification.body,
            icon:   '/icons/icon-192x192.png',
            badge:  '/icons/badge-72x72.png',
            click_action: notification.clickAction ?? '/',
          },
          fcmOptions: {
            link: notification.clickAction ?? '/',
          },
        },
        android: {
          notification: {
            icon:  'ic_notification',
            color: '#F97316',
            sound: 'default',
          },
          priority: 'high',
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      }

      const response = await messaging.sendEachForMulticast(message)
      totalSent   += response.successCount
      totalFailed += response.failureCount

      // Collecter les tokens invalides
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          const code = resp.error.code
          if (
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered'
          ) {
            const token = batch[idx]
            if (token) invalidTokens.push(token)
          }
        }
      })
    }

    // Supprimer les tokens invalides
    if (invalidTokens.length) {
      await removeInvalidTokens(invalidTokens)
      if (userId) {
        await logAudit({
          userId:    'system',
          action:    'fcm_tokens_cleaned',
          tableName: 'push_tokens',
          recordId:  userId,
          newData:   { removed: invalidTokens.length },
        })
      }
    }

    return { sent: totalSent, failed: totalFailed }
  } catch (err) {
    console.error('[FCM] sendToTokens error:', err)
    throw err
  }
}
