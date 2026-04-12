'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import type { UserDB } from '@/types'

// ─── Hook countdown ───────────────────────────────────────────────────────────

function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = React.useState(initialSeconds)

  React.useEffect(() => {
    if (seconds <= 0) return
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [seconds])

  function reset(s: number) { setSeconds(s) }
  return { seconds, canResend: seconds <= 0, reset }
}

// ─── Composant 6 inputs OTP ───────────────────────────────────────────────────

function OtpInputs({
  value,
  onChange,
  disabled,
  hasError,
}: {
  value: string[]
  onChange: (v: string[]) => void
  disabled: boolean
  hasError: boolean
}) {
  const refs = Array.from({ length: 6 }, () => React.useRef<HTMLInputElement>(null))

  function handleInput(index: number, char: string) {
    if (!/^\d$/.test(char)) return
    const next = [...value]
    next[index] = char
    onChange(next)
    // Auto-focus suivant
    if (index < 5) refs[index + 1]?.current?.focus()
  }

  function handleKey(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (value[index]) {
        const next = [...value]; next[index] = ''; onChange(next)
      } else if (index > 0) {
        refs[index - 1]?.current?.focus()
        const next = [...value]; next[index - 1] = ''; onChange(next)
      }
      e.preventDefault()
    }
    if (e.key === 'ArrowLeft'  && index > 0) refs[index - 1]?.current?.focus()
    if (e.key === 'ArrowRight' && index < 5) refs[index + 1]?.current?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    const next = Array(6).fill('')
    text.split('').forEach((c, i) => { next[i] = c })
    onChange(next)
    // Focus dernier rempli
    const lastIndex = Math.min(text.length, 5)
    refs[lastIndex]?.current?.focus()
  }

  return (
    <div
      className="flex gap-2 justify-center"
      onPaste={handlePaste}
      aria-label="Code OTP à 6 chiffres"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          disabled={disabled}
          autoFocus={i === 0}
          aria-label={`Chiffre ${i + 1} du code OTP`}
          className={[
            'w-11 h-14 text-center text-xl font-bold rounded-2xl border-2 transition-all duration-150',
            'bg-white/10 text-white caret-[#F97316]',
            'focus:outline-none focus:scale-105',
            'disabled:opacity-40',
            hasError
              ? 'border-red-500 bg-red-500/10'
              : value[i]
              ? 'border-[#F97316] bg-[#F97316]/10'
              : 'border-white/20 focus:border-[#F97316]',
          ].join(' ')}
        />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VerifyPage() {
  const router  = useRouter()
  const setSession = useAuthStore((s) => s.setSession)

  // Lire les données de session (stockées par /login)
  const [maskedPhone, setMaskedPhone] = React.useState('')
  const [phone,       setPhone]       = React.useState('')

  React.useEffect(() => {
    const stored = sessionStorage.getItem('auth:phone') ?? ''
    const masked = sessionStorage.getItem('auth:maskedPhone') ?? ''
    const expIn  = parseInt(sessionStorage.getItem('auth:expiresIn') ?? '60', 10)
    if (!stored) { router.replace('/login'); return }
    setPhone(stored)
    setMaskedPhone(masked)
    setSeconds(Math.min(expIn, 60))   // countdown max 60s visible
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [digits,    setDigits]    = React.useState<string[]>(Array(6).fill(''))
  const [loading,   setLoading]   = React.useState(false)
  const [error,     setError]     = React.useState('')
  const [remaining, setRemaining] = React.useState<number | null>(null)
  const [seconds,   setSeconds]   = React.useState(60)

  // Countdown mécanique
  React.useEffect(() => {
    if (seconds <= 0) return
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [seconds])

  const canResend = seconds <= 0
  const code      = digits.join('')

  // Auto-submit quand 6ème chiffre saisi
  React.useEffect(() => {
    if (code.length === 6 && !loading) {
      void submit(code)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  async function submit(otp: string) {
    if (loading || !phone || otp.length < 6) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ telephone: phone.replace('+237', ''), code: otp }),
      })
      const data = await res.json() as {
        isNew?: boolean
        requiresProfile?: boolean
        tempToken?: string
        user?: UserDB
        accessToken?: string
        expiresAt?: number
        error?: string
        remaining?: number
      }

      if (!res.ok) {
        setError(data.error ?? 'Code invalide. Vérifiez et réessayez.')
        if (data.remaining !== undefined) setRemaining(data.remaining)
        setDigits(Array(6).fill(''))
        return
      }

      if (data.isNew && data.requiresProfile && data.tempToken) {
        // Nouvel utilisateur → compléter le profil
        sessionStorage.setItem('auth:tempToken', data.tempToken)
        router.push('/register')
        return
      }

      // Utilisateur existant → session créée
      if (data.user && data.accessToken && data.expiresAt) {
        setSession({ user: data.user, accessToken: data.accessToken, expiresAt: data.expiresAt })
        sessionStorage.removeItem('auth:phone')
        sessionStorage.removeItem('auth:maskedPhone')
        sessionStorage.removeItem('auth:expiresIn')
        router.replace('/menu')
      }
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!canResend || !phone || loading) return
    setError('')
    setDigits(Array(6).fill(''))
    setRemaining(null)

    try {
      const res = await fetch('/api/auth/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ telephone: phone.replace('+237', '') }),
      })
      const data = await res.json() as { error?: string; expiresIn?: number }
      if (!res.ok) { setError(data.error ?? 'Erreur lors du renvoi.'); return }
      setSeconds(60)
    } catch {
      setError('Erreur réseau.')
    }
  }

  const minuteStr = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

  return (
    <div
      className="flex flex-col gap-6"
      style={{ animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1) both' }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white">Vérification</h1>
          <p className="text-sm text-white/50 mt-1">
            Code envoyé au{' '}
            <span className="text-white font-semibold">{maskedPhone || phone}</span>
          </p>
        </div>

        {/* 6 inputs */}
        <OtpInputs
          value={digits}
          onChange={setDigits}
          disabled={loading}
          hasError={!!error}
        />

        {/* Erreur */}
        {error && (
          <div role="alert" className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 text-center">
            {error}
            {remaining !== null && remaining > 0 && (
              <span className="block text-xs mt-0.5 text-red-300">
                {remaining} tentative{remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center justify-center gap-2 text-white/50 text-sm" aria-live="polite">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Vérification…
          </div>
        )}

        {/* Renvoyer le code */}
        <div className="text-center text-sm">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="text-[#F97316] font-semibold hover:text-[#FF8C00] transition-colors disabled:opacity-40"
            >
              Renvoyer le code
            </button>
          ) : (
            <span className="text-white/40">
              Renvoyer dans{' '}
              <span
                className="font-mono font-semibold text-white/60"
                aria-live="polite"
                aria-atomic="true"
              >
                {minuteStr}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Retour */}
      <div className="text-center text-sm text-white/40">
        <Link href="/login" className="hover:text-white transition-colors underline underline-offset-2">
          ← Changer de numéro
        </Link>
      </div>
    </div>
  )
}
