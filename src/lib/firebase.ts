/**
 * Firebase SDK — lazy-initialized singleton
 * Auth, Firestore, Storage, FCM are only initialized on first use.
 * Environment variables are validated at startup (warn, not throw)
 * so the app can still boot in environments without Firebase.
 */

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getMessaging, isSupported } from 'firebase/messaging'
import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'
import type { FirebaseStorage } from 'firebase/storage'
import type { Messaging } from 'firebase/messaging'

// ─── Environment validation ─────────────────────────────────────────────────

const REQUIRED_VARS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const

function validateFirebaseEnv(): void {
  if (typeof window === 'undefined') return // skip during SSR/build
  const missing = REQUIRED_VARS.filter((v) => !process.env[v])
  if (missing.length > 0) {
    console.warn(
      `[Firebase] Variables d'environnement manquantes : ${missing.join(', ')}. ` +
        'Certaines fonctionnalités Firebase ne seront pas disponibles.'
    )
  }
}

// ─── Config ─────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            ?? '',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? '',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? '',
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             ?? '',
}

// ─── Lazy singletons ────────────────────────────────────────────────────────

let _app:       FirebaseApp      | null = null
let _auth:      Auth             | null = null
let _firestore: Firestore        | null = null
let _storage:   FirebaseStorage  | null = null

/** Returns (or creates) the Firebase app singleton. */
export function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    validateFirebaseEnv()
    _app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
  }
  return _app
}

/** Firebase Auth — used for supplementary auth flows (Google sign-in, etc.) */
export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(getFirebaseApp())
  return _auth
}

/** Firestore — for real-time order tracking & chat */
export function getFirebaseFirestore(): Firestore {
  if (!_firestore) _firestore = getFirestore(getFirebaseApp())
  return _firestore
}

/** Firebase Storage — for menu images and profile avatars */
export function getFirebaseStorage(): FirebaseStorage {
  if (!_storage) _storage = getStorage(getFirebaseApp())
  return _storage
}

/**
 * Firebase Cloud Messaging — returns null on server or unsupported browsers.
 * Always check for null before using.
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null
  const supported = await isSupported()
  if (!supported) return null
  return getMessaging(getFirebaseApp())
}

/**
 * Register the FCM service worker and return the push token.
 * Returns null if FCM is not supported or permission is denied.
 */
export async function requestFCMToken(): Promise<string | null> {
  try {
    const { getToken } = await import('firebase/messaging')
    const messaging = await getFirebaseMessaging()
    if (!messaging) return null

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    if (!vapidKey) {
      console.warn('[Firebase] NEXT_PUBLIC_FIREBASE_VAPID_KEY non défini')
      return null
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    })
    return token || null
  } catch (err) {
    console.error('[Firebase] Impossible d\u2019obtenir le token FCM :', err)
    return null
  }
}
