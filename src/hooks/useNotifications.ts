'use client'

/**
 * Hook useNotifications
 *
 * - Demande la permission de notifications au navigateur
 * - Enregistre le token FCM dans Supabase (push_tokens)
 * - Gère les notifications foreground (toast via Supabase Realtime)
 * - Expose badge count + liste notifications in-app
 * - Centre notifications avec marquage comme lu
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import type { Notification } from '@/types/notifications'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseNotificationsReturn {
  /** Nombre de notifications non lues */
  unreadCount:  number
  /** Liste des notifications (max 50) */
  notifications: Notification[]
  /** true si la permission a été accordée */
  hasPermission: boolean
  /** Demander explicitement la permission push */
  requestPermission: () => Promise<boolean>
  /** Marquer une notification comme lue */
  markAsRead: (id: string) => Promise<void>
  /** Marquer toutes comme lues */
  markAllAsRead: () => Promise<void>
  /** Recharger les notifications */
  refresh: () => Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications(): UseNotificationsReturn {
  const user = useAuthStore((s) => s.user)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [hasPermission, setHasPermission] = useState(false)

  const tokenRegisteredRef = useRef(false)

  // ── Fetch notifications depuis Supabase ──────────────────────────────────

  const refresh = useCallback(async () => {
    if (!user?.id) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) {
      const notifs = data as Notification[]
      setNotifications(notifs)
      setUnreadCount(notifs.filter((n) => !n.is_read).length)
    }
  }, [user?.id])

  // ── Enregistrer token FCM ────────────────────────────────────────────────

  const registerToken = useCallback(async (token: string) => {
    if (!user?.id || tokenRegisteredRef.current) return
    tokenRegisteredRef.current = true

    await supabase.from('push_tokens').upsert(
      { user_id: user.id, token, updated_at: new Date().toISOString() },
      { onConflict: 'token' }
    )
  }, [user?.id])

  // ── Demander permission + obtenir token FCM ──────────────────────────────

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setHasPermission(false)
        return false
      }

      setHasPermission(true)

      // Importer Firebase dynamiquement (évite SSR)
      const { getApp }       = await import('firebase/app')
      const { getMessaging, getToken } = await import('firebase/messaging')

      const app       = getApp()
      const messaging = getMessaging(app)

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      const swReg    = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      const token    = await getToken(messaging, {
        ...(vapidKey !== undefined && { vapidKey }),
        serviceWorkerRegistration: swReg,
      })

      if (token) await registerToken(token)

      return true
    } catch (err) {
      console.warn('[useNotifications] requestPermission error:', err)
      return false
    }
  }, [registerToken])

  // ── Initialisation ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.id) return

    // Charger les notifications initiales
    refresh()

    // Vérifier la permission existante
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const granted = Notification.permission === 'granted'
      setHasPermission(granted)

      // Si déjà accordée, enregistrer/rafraîchir le token silencieusement
      if (granted && !tokenRegisteredRef.current) {
        requestPermission().catch(() => {})
      }
    }
  }, [user?.id, refresh, requestPermission])

  // ── Realtime : nouvelles notifications ───────────────────────────────────

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`notifs:${user.id}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notif = payload.new as Notification

          // Ajouter en tête de liste
          setNotifications((prev) => [notif, ...prev].slice(0, 50))
          setUnreadCount((c) => c + 1)

          // Toast foreground (notification système si permission accordée)
          if (hasPermission && typeof window !== 'undefined' && 'Notification' in window) {
            const n = new Notification(notif.title, {
              body:  notif.body,
              icon:  '/icons/icon-192x192.png',
              badge: '/icons/badge-72x72.png',
              tag:   notif.id,
              data:  notif.data,
            })
            n.onclick = () => {
              window.focus()
              const url = notif.data?.click_action ?? notif.data?.commandeId
                ? `/orders/${notif.data.commandeId}`
                : '/'
              window.location.href = url
              n.close()
            }
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, hasPermission])

  // ── markAsRead ────────────────────────────────────────────────────────────

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, is_read: true } : n)
    )
    setUnreadCount((c) => Math.max(0, c - 1))

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
  }, [])

  // ── markAllAsRead ─────────────────────────────────────────────────────────

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
  }, [user?.id])

  return {
    notifications,
    unreadCount,
    hasPermission,
    requestPermission,
    markAsRead,
    markAllAsRead,
    refresh,
  }
}
