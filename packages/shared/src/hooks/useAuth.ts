/**
 * useAuth — Hook partagé d'authentification
 *
 * Compatible web (fetch) et mobile (fetch with baseUrl).
 * Gère : session, auto-refresh, login OTP, logout.
 *
 * Usage web   : useAuth()
 * Usage mobile: useAuth({ baseUrl: 'https://api.daada.cm' })
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'admin' | 'delivery_agent' | 'driver' | 'kitchen' | 'super_admin'

export type AuthUser = {
  id:            string
  nom:           string
  telephone?:    string
  email?:        string
  role:          UserRole
  referral_code?: string
  premium_active?: boolean
  premium_expires_at?: string | null
}

export type AuthState = {
  user:            AuthUser | null
  isLoading:       boolean
  isAuthenticated: boolean
  isAdmin:         boolean
  isPremium:       boolean
  accessToken:     string | null
  expiresAt:       number | null
}

export type UseAuthOptions = {
  /** URL de base de l'API. Défaut: '' (même domaine, pour Next.js) */
  baseUrl?: string
  /** Callback appelé après chaque changement de session */
  onSessionChange?: (user: AuthUser | null) => void
  /** Stockage du token (pour mobile: Expo SecureStore) */
  storage?: {
    get: (key: string) => Promise<string | null>
    set: (key: string, value: string) => Promise<void>
    del: (key: string) => Promise<void>
  }
}

export type UseAuthReturn = AuthState & {
  login:        (phone: string) => Promise<{ success: boolean; maskedPhone?: string; error?: string }>
  logout:       () => Promise<void>
  refreshToken: () => Promise<boolean>
  setSession:   (user: AuthUser, accessToken: string, expiresAt: number) => void
  clearSession: () => void
}

// ─── Implémentation ───────────────────────────────────────────────────────────

export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const { baseUrl = '', onSessionChange, storage } = options

  const [state, setState] = useState<AuthState>({
    user:            null,
    isLoading:       true,
    isAuthenticated: false,
    isAdmin:         false,
    isPremium:       false,
    accessToken:     null,
    expiresAt:       null,
  })

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Helpers ───────────────────────────────────────────────────────────────

  function buildState(user: AuthUser | null, accessToken: string | null = null, expiresAt: number | null = null): AuthState {
    const isAuthenticated = user !== null
    const isAdmin         = user?.role === 'admin' || user?.role === 'super_admin'
    const isPremium       = user?.premium_active === true &&
      (!user.premium_expires_at || new Date(user.premium_expires_at) > new Date())

    return { user, isLoading: false, isAuthenticated, isAdmin, isPremium, accessToken, expiresAt }
  }

  async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
    return fetch(`${baseUrl}${path}`, {
      credentials: 'include',
      ...init,
    })
  }

  // ── Auto-refresh ──────────────────────────────────────────────────────────

  const scheduleRefresh = useCallback((expiresAt: number) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    const nowSec  = Math.floor(Date.now() / 1000)
    const delayMs = Math.max(0, (expiresAt - nowSec - 60) * 1000)

    refreshTimerRef.current = setTimeout(async () => {
      const ok = await refreshToken()
      if (!ok) clearSession()
    }, delayMs)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Initialisation ────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      // Pour mobile, tenter de restaurer depuis le storage
      if (storage) {
        const stored = await storage.get('auth:accessToken')
        const exp    = await storage.get('auth:expiresAt')
        if (stored && exp) {
          const expiresAt = parseInt(exp, 10)
          if (expiresAt > Math.floor(Date.now() / 1000)) {
            // Token encore valide — récupérer le profil
            try {
              const res  = await apiFetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${stored}` },
              })
              if (res.ok) {
                const data = await res.json() as { user: AuthUser; expiresAt: number }
                setState(buildState(data.user, stored, data.expiresAt))
                onSessionChange?.(data.user)
                scheduleRefresh(data.expiresAt)
                return
              }
            } catch {}
          }
          // Token expiré — nettoyer
          await storage.del('auth:accessToken')
          await storage.del('auth:expiresAt')
        }
      }

      // Web : vérifier via cookie httpOnly
      try {
        const res = await apiFetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json() as { user: AuthUser; expiresAt: number }
          setState(buildState(data.user, null, data.expiresAt))
          onSessionChange?.(data.user)
          scheduleRefresh(data.expiresAt)
          return
        }
      } catch {}

      setState(buildState(null))
    }

    void init()

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ───────────────────────────────────────────────────────────────

  const login = useCallback(async (phone: string) => {
    try {
      const res = await apiFetch('/api/auth/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ telephone: phone }),
      })
      const data = await res.json() as { success?: boolean; maskedPhone?: string; error?: string }
      if (!res.ok) return { success: false, error: data.error }
      return { success: true, maskedPhone: data.maskedPhone }
    } catch {
      return { success: false, error: 'Erreur réseau.' }
    }
  }, [baseUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    if (storage) {
      await storage.del('auth:accessToken')
      await storage.del('auth:expiresAt')
    }
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    setState(buildState(null))
    onSessionChange?.(null)
  }, [baseUrl, storage, onSessionChange]) // eslint-disable-line react-hooks/exhaustive-deps

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const res = await apiFetch('/api/auth/refresh', { method: 'POST' })
      if (!res.ok) return false
      const data = await res.json() as { accessToken: string; expiresAt: number }
      setState((prev) => ({ ...prev, accessToken: data.accessToken, expiresAt: data.expiresAt }))
      if (storage) {
        await storage.set('auth:accessToken', data.accessToken)
        await storage.set('auth:expiresAt', String(data.expiresAt))
      }
      scheduleRefresh(data.expiresAt)
      return true
    } catch {
      return false
    }
  }, [baseUrl, storage, scheduleRefresh]) // eslint-disable-line react-hooks/exhaustive-deps

  const setSession = useCallback((user: AuthUser, accessToken: string, expiresAt: number) => {
    setState(buildState(user, accessToken, expiresAt))
    onSessionChange?.(user)
    scheduleRefresh(expiresAt)
    if (storage) {
      void storage.set('auth:accessToken', accessToken)
      void storage.set('auth:expiresAt', String(expiresAt))
    }
  }, [onSessionChange, scheduleRefresh, storage])

  const clearSession = useCallback(() => {
    setState(buildState(null))
    onSessionChange?.(null)
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    if (storage) {
      void storage.del('auth:accessToken')
      void storage.del('auth:expiresAt')
    }
  }, [onSessionChange, storage])

  return { ...state, login, logout, refreshToken, setSession, clearSession }
}
