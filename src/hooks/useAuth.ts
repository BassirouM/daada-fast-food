'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import type { UpdateProfilInput } from '@/lib/security/validation'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SendOtpResult = {
  success: boolean
  expiresIn: number | undefined
  error: string | undefined
}

export type VerifyOtpResult = {
  success: boolean
  isNewUser: boolean | undefined
  error: string | undefined
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const {
    userDB,
    accessToken,
    tokenExpiry,
    role,
    isLoading,
    isAuthenticated,
    setSession,
    setAccessToken,
    clearSession,
    setLoading,
  } = useAuthStore()

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Auto-refresh du token ─────────────────────────────────────────────────

  const scheduleRefresh = useCallback((expiresAt: number) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)

    const nowSec     = Math.floor(Date.now() / 1000)
    const delayMs    = Math.max(0, (expiresAt - nowSec - 60) * 1000) // 1 min avant expiration

    refreshTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
        if (res.ok) {
          const data = await res.json() as { accessToken: string; expiresAt: number }
          setAccessToken(data.accessToken, data.expiresAt)
          scheduleRefresh(data.expiresAt)
        } else {
          clearSession()
        }
      } catch {
        // Réseau indisponible — réessayer au prochain rendu
      }
    }, delayMs)
  }, [setAccessToken, clearSession])

  // ── Initialisation (hydration) ────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json() as { user: Parameters<typeof setSession>[0]['user']; expiresAt: number }
          // On n'a pas l'accessToken ici (httpOnly) — on met à jour userDB seulement
          setSession({ user: data.user, accessToken: accessToken ?? '', expiresAt: data.expiresAt })
          scheduleRefresh(data.expiresAt)
        } else {
          clearSession()
        }
      } catch {
        clearSession()
      }
    }

    if (!isAuthenticated) {
      void init()
    } else {
      setLoading(false)
      if (tokenExpiry) scheduleRefresh(tokenExpiry)
    }

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Actions ───────────────────────────────────────────────────────────────

  const sendOtp = useCallback(async (telephone: string): Promise<SendOtpResult> => {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ telephone }),
      })
      const data = await res.json() as { success?: boolean; expiresIn?: number; error?: string }
      if (!res.ok) return { success: false, error: data.error ?? 'Erreur envoi OTP', expiresIn: undefined }
      return { success: true, expiresIn: data.expiresIn, error: undefined }
    } catch {
      return { success: false, error: 'Erreur réseau. Vérifiez votre connexion.', expiresIn: undefined }
    }
  }, [])

  const verifyOtp = useCallback(async (telephone: string, code: string): Promise<VerifyOtpResult> => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ telephone, code }),
      })
      const data = await res.json() as {
        user?: Parameters<typeof setSession>[0]['user']
        accessToken?: string
        expiresAt?: number
        isNewUser?: boolean
        error?: string
      }
      if (!res.ok) return { success: false, error: data.error ?? 'Code invalide', isNewUser: undefined }

      if (data.user && data.accessToken && data.expiresAt) {
        setSession({ user: data.user, accessToken: data.accessToken, expiresAt: data.expiresAt })
        scheduleRefresh(data.expiresAt)
      }

      return { success: true, isNewUser: data.isNewUser, error: undefined }
    } catch {
      return { success: false, error: 'Erreur réseau. Vérifiez votre connexion.', isNewUser: undefined }
    }
  }, [setSession, scheduleRefresh])

  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } finally {
      clearSession()
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [clearSession])

  const updateProfile = useCallback(async (input: UpdateProfilInput): Promise<boolean> => {
    try {
      const res = await fetch('/api/users/profile', {
        method:      'PATCH',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(input),
      })
      if (!res.ok) return false

      // Rafraîchir le profil
      const meRes = await fetch('/api/auth/me', { credentials: 'include' })
      if (meRes.ok) {
        const data = await meRes.json() as { user: Parameters<typeof setSession>[0]['user']; expiresAt: number }
        setSession({ user: data.user, accessToken: accessToken ?? '', expiresAt: data.expiresAt })
      }
      return true
    } catch {
      return false
    }
  }, [accessToken, setSession])

  return {
    user:            userDB,
    accessToken,
    tokenExpiry,
    role,
    isLoading,
    isAuthenticated,
    sendOtp,
    verifyOtp,
    logout,
    updateProfile,
  }
}
