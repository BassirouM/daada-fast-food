/**
 * Firebase Cloud Messaging — Service Worker
 *
 * Gère les notifications push en arrière-plan (quand l'app est fermée/minimisée).
 * Ce fichier doit rester à la racine de /public pour être servi depuis /
 *
 * Fonctionnalités :
 *   - Réception notifications background
 *   - Affichage notification système avec icône Daada
 *   - Click → ouvre la bonne page (order, menu, etc.)
 */

/* global firebase, clients, self */

// ─── Import Firebase scripts ──────────────────────────────────────────────────

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// ─── Firebase config ──────────────────────────────────────────────────────────
// Ces valeurs sont publiques (NEXT_PUBLIC_*) — safe d'inclure dans le SW

const firebaseConfig = {
  apiKey:            self.__FIREBASE_API_KEY__            ?? '',
  authDomain:        self.__FIREBASE_AUTH_DOMAIN__        ?? '',
  projectId:         self.__FIREBASE_PROJECT_ID__         ?? '',
  storageBucket:     self.__FIREBASE_STORAGE_BUCKET__     ?? '',
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID__ ?? '',
  appId:             self.__FIREBASE_APP_ID__             ?? '',
}

// Initialiser uniquement si la config est disponible
let messaging = null

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    firebase.initializeApp(firebaseConfig)
    messaging = firebase.messaging()
  }
} catch (err) {
  console.warn('[SW] Firebase init failed:', err)
}

// ─── Background message handler ───────────────────────────────────────────────

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload)

    const notificationTitle = payload.notification?.title ?? 'Daada Fast Food'
    const notificationBody  = payload.notification?.body  ?? ''
    const clickAction       = payload.data?.click_action  ?? '/'
    const commandeId        = payload.data?.commandeId    ?? ''

    const notificationOptions = {
      body:    notificationBody,
      icon:    '/icons/icon-192x192.png',
      badge:   '/icons/badge-72x72.png',
      image:   payload.notification?.image,
      tag:     commandeId || 'daada-notification',
      renotify: Boolean(commandeId),
      data: {
        click_action: clickAction,
        commandeId,
        url: clickAction,
      },
      actions: commandeId
        ? [
            { action: 'view',    title: '👁 Voir',    icon: '/icons/icon-96x96.png' },
            { action: 'dismiss', title: '✕ Fermer' },
          ]
        : [],
      vibrate: [200, 100, 200],
      requireInteraction: false,
    }

    return self.registration.showNotification(notificationTitle, notificationOptions)
  })
}

// ─── Notification click handler ───────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const action      = event.action
  const data        = event.notification.data ?? {}
  const clickAction = data.click_action ?? data.url ?? '/'

  if (action === 'dismiss') return

  // Ouvrir ou focuser l'onglet existant
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Chercher un onglet déjà ouvert sur le même domaine
      for (const client of clientList) {
        const clientUrl = new URL(client.url)
        const targetUrl = new URL(clickAction, self.location.origin)

        if (clientUrl.origin === targetUrl.origin) {
          client.focus()
          return client.navigate(targetUrl.href)
        }
      }
      // Ouvrir un nouvel onglet
      return clients.openWindow(clickAction)
    })
  )
})

// ─── Install & activate ───────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
