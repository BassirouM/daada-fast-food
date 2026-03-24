/**
 * Configuration des providers Firebase Auth
 * Utilisé pour l'authentification sociale (Google, etc.)
 * L'OTP principal passe par Twilio — Firebase Auth est optionnel.
 */

import type { Auth, GoogleAuthProvider as GoogleAuthProviderType } from 'firebase/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FirebaseAuthResult = {
  uid: string
  email: string | null
  displayName: string | null
  phoneNumber: string | null
  photoURL: string | null
}

// ─── Google Provider ──────────────────────────────────────────────────────────

/**
 * Initialise et retourne le GoogleAuthProvider avec les scopes requis.
 * Lazy import pour éviter de charger Firebase inutilement.
 */
export async function getGoogleProvider(): Promise<GoogleAuthProviderType> {
  const { GoogleAuthProvider } = await import('firebase/auth')
  const provider = new GoogleAuthProvider()
  provider.addScope('profile')
  provider.addScope('email')
  provider.setCustomParameters({ prompt: 'select_account' })
  return provider
}

/**
 * Lance le flux de connexion Google via popup.
 * Retourne les infos utilisateur Firebase ou null en cas d'échec.
 */
export async function signInWithGoogle(auth: Auth): Promise<FirebaseAuthResult | null> {
  try {
    const { signInWithPopup } = await import('firebase/auth')
    const provider = await getGoogleProvider()
    const result = await signInWithPopup(auth, provider)
    const user = result.user

    return {
      uid:         user.uid,
      email:       user.email,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
      photoURL:    user.photoURL,
    }
  } catch (err) {
    console.error('[Firebase] Erreur connexion Google :', err)
    return null
  }
}

/**
 * Déconnecte l'utilisateur Firebase (ne révoque pas le JWT Daada).
 */
export async function signOutFirebase(auth: Auth): Promise<void> {
  try {
    const { signOut } = await import('firebase/auth')
    await signOut(auth)
  } catch (err) {
    console.error('[Firebase] Erreur déconnexion :', err)
  }
}
