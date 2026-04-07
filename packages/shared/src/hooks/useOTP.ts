/**
 * useOTP — Hook partagé de gestion OTP
 *
 * Compatible web et mobile.
 * Gère : envoi OTP, vérification OTP, compte à rebours, renvoi.
 *
 * Usage:
 *   const { sendOTP, verifyOTP, countdown, canResend, isLoading, error } = useOTP()
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type OTPState = 'idle' | 'sent' | 'verifying' | 'success' | 'error'

export type SendOTPResult = {
  success:      boolean
  maskedPhone?: string
  expiresIn?:   number
  error?:       string
}

export type VerifyOTPResult = {
  success:          boolean
  isNew?:           boolean
  requiresProfile?: boolean
  tempToken?:       string
  error?:           string
  remaining?:       number
}

export type UseOTPOptions = {
  baseUrl?:         string
  resendCooldown?:  number   // secondes (défaut: 60)
}

export type UseOTPReturn = {
  /** Envoie l'OTP par SMS au numéro donné */
  sendOTP:     (phone: string) => Promise<SendOTPResult>
  /** Vérifie le code OTP */
  verifyOTP:   (phone: string, code: string) => Promise<VerifyOTPResult>
  /** Secondes restantes avant de pouvoir renvoyer */
  countdown:   number
  /** Peut-on renvoyer un nouveau code ? */
  canResend:   boolean
  /** Numéro masqué renvoyé par l'API */
  maskedPhone: string
  /** Chargement en cours */
  isLoading:   boolean
  /** Dernier message d'erreur */
  error:       string
  /** Tentatives restantes pour le code en cours */
  remaining:   number | null
  /** État général du flux OTP */
  state:       OTPState
  /** Réinitialise le hook */
  reset:       () => void
}

// ─── Implémentation ───────────────────────────────────────────────────────────

export function useOTP(options: UseOTPOptions = {}): UseOTPReturn {
  const { baseUrl = '', resendCooldown = 60 } = options

  const [otpState,    setOtpState]    = useState<OTPState>('idle')
  const [isLoading,   setIsLoading]   = useState(false)
  const [error,       setError]       = useState('')
  const [maskedPhone, setMaskedPhone] = useState('')
  const [remaining,   setRemaining]   = useState<number | null>(null)
  const [countdown,   setCountdown]   = useState(0)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startCountdown(seconds: number) {
    setCountdown(seconds)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const sendOTP = useCallback(async (phone: string): Promise<SendOTPResult> => {
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch(`${baseUrl}/api/auth/send-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ telephone: phone }),
      })
      const data = await res.json() as {
        success?: boolean
        maskedPhone?: string
        expiresIn?: number
        error?: string
        resetIn?: number
      }

      if (!res.ok) {
        const errMsg = data.error ?? 'Erreur lors de l\'envoi du SMS.'
        setError(errMsg)
        setOtpState('error')
        return { success: false, error: errMsg }
      }

      const masked  = data.maskedPhone ?? ''
      const expires = data.expiresIn ?? resendCooldown

      setMaskedPhone(masked)
      setOtpState('sent')
      startCountdown(Math.min(expires, resendCooldown))

      return { success: true, maskedPhone: masked, expiresIn: expires }
    } catch {
      const errMsg = 'Erreur réseau. Vérifiez votre connexion.'
      setError(errMsg)
      setOtpState('error')
      return { success: false, error: errMsg }
    } finally {
      setIsLoading(false)
    }
  }, [baseUrl, resendCooldown])

  const verifyOTP = useCallback(async (phone: string, code: string): Promise<VerifyOTPResult> => {
    setIsLoading(true)
    setError('')
    setOtpState('verifying')

    try {
      const res = await fetch(`${baseUrl}/api/auth/verify-otp`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ telephone: phone, code }),
      })
      const data = await res.json() as {
        isNew?: boolean
        requiresProfile?: boolean
        tempToken?: string
        error?: string
        remaining?: number
      }

      if (!res.ok) {
        const errMsg = data.error ?? 'Code invalide.'
        setError(errMsg)
        setOtpState('sent')   // reste dans l'état "envoyé" pour permettre de réessayer
        if (data.remaining !== undefined) setRemaining(data.remaining)
        return { success: false, error: errMsg, remaining: data.remaining }
      }

      setOtpState('success')
      setRemaining(null)
      return {
        success:         true,
        isNew:           data.isNew,
        requiresProfile: data.requiresProfile,
        tempToken:       data.tempToken,
      }
    } catch {
      const errMsg = 'Erreur réseau. Vérifiez votre connexion.'
      setError(errMsg)
      setOtpState('error')
      return { success: false, error: errMsg }
    } finally {
      setIsLoading(false)
    }
  }, [baseUrl])

  const reset = useCallback(() => {
    setOtpState('idle')
    setIsLoading(false)
    setError('')
    setMaskedPhone('')
    setRemaining(null)
    setCountdown(0)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  return {
    sendOTP,
    verifyOTP,
    countdown,
    canResend: countdown <= 0 && otpState !== 'idle',
    maskedPhone,
    isLoading,
    error,
    remaining,
    state: otpState,
    reset,
  }
}
