'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import type { UserDB } from '@/types'

export default function RegisterPage() {
  const router     = useRouter()
  const setSession = useAuthStore((s) => s.setSession)

  const [firstName,    setFirstName]    = React.useState('')
  const [lastName,     setLastName]     = React.useState('')
  const [referralCode, setReferralCode] = React.useState('')
  const [cguAccepted,  setCguAccepted]  = React.useState(false)
  const [loading,      setLoading]      = React.useState(false)
  const [error,        setError]        = React.useState('')

  const isValid =
    firstName.trim().length >= 1 &&
    lastName.trim().length >= 1 &&
    cguAccepted

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || loading) return

    const tempToken = sessionStorage.getItem('auth:tempToken')
    if (!tempToken) {
      setError('Session expirée. Recommencez la connexion.')
      router.replace('/login')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/complete-profile', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tempToken,
          firstName:    firstName.trim(),
          lastName:     lastName.trim(),
          referralCode: referralCode.trim().toUpperCase() || undefined,
        }),
      })
      const data = await res.json() as {
        user?: UserDB
        accessToken?: string
        expiresAt?: number
        error?: string
      }

      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la création du compte.')
        return
      }

      if (data.user && data.accessToken && data.expiresAt) {
        setSession({ user: data.user, accessToken: data.accessToken, expiresAt: data.expiresAt })
        sessionStorage.removeItem('auth:tempToken')
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

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl">
        <h1 className="text-xl font-bold text-white mb-1">Créer mon compte</h1>
        <p className="text-sm text-white/50 mb-6">
          Complétez votre profil pour commencer à commander.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Prénom */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="firstName" className="text-sm font-medium text-white/80">
              Prénom <span className="text-[#F97316]" aria-hidden>*</span>
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Aminatou"
              required
              maxLength={50}
              autoComplete="given-name"
              disabled={loading}
              aria-required="true"
              className="h-12 px-4 rounded-2xl text-sm text-white bg-white/10 border-2 border-white/20 placeholder:text-white/30 focus:outline-none focus:border-[#F97316] disabled:opacity-50 transition-colors"
            />
          </div>

          {/* Nom */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lastName" className="text-sm font-medium text-white/80">
              Nom <span className="text-[#F97316]" aria-hidden>*</span>
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Moussa"
              required
              maxLength={50}
              autoComplete="family-name"
              disabled={loading}
              aria-required="true"
              className="h-12 px-4 rounded-2xl text-sm text-white bg-white/10 border-2 border-white/20 placeholder:text-white/30 focus:outline-none focus:border-[#F97316] disabled:opacity-50 transition-colors"
            />
          </div>

          {/* Code parrainage (optionnel) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="referralCode" className="text-sm font-medium text-white/80">
              Code de parrainage{' '}
              <span className="text-white/30 font-normal text-xs">(optionnel)</span>
            </label>
            <input
              id="referralCode"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              placeholder="EX: ABC123"
              maxLength={6}
              disabled={loading}
              className="h-12 px-4 rounded-2xl text-sm text-white bg-white/10 border-2 border-white/20 placeholder:text-white/30 focus:outline-none focus:border-[#F97316] disabled:opacity-50 transition-colors font-mono tracking-widest"
            />
            <p className="text-xs text-white/30">
              Si un ami vous a invité, saisissez son code pour obtenir un bonus.
            </p>
          </div>

          {/* CGU */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={cguAccepted}
                onChange={(e) => setCguAccepted(e.target.checked)}
                disabled={loading}
                className="sr-only"
                aria-label="J'accepte les conditions générales d'utilisation"
              />
              <div
                className={[
                  'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150',
                  cguAccepted
                    ? 'bg-[#F97316] border-[#F97316]'
                    : 'border-white/30 bg-white/10',
                ].join(' ')}
                aria-hidden
              >
                {cguAccepted && (
                  <svg viewBox="0 0 10 8" className="w-3 h-3 text-white" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-white/60 leading-relaxed">
              J'accepte les{' '}
              <Link href="/cgu" target="_blank" className="text-[#F97316] hover:underline">
                conditions générales d'utilisation
              </Link>{' '}
              de Daada.
            </span>
          </label>

          {/* Erreur */}
          {error && (
            <div role="alert" className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || loading}
            aria-busy={loading}
            className={[
              'w-full py-4 rounded-2xl text-sm font-bold transition-all duration-150 mt-1',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]',
              isValid && !loading
                ? 'bg-[#F97316] text-white hover:bg-[#FF8C00] active:scale-[0.98] shadow-lg shadow-orange-500/30'
                : 'bg-white/10 text-white/30 cursor-not-allowed',
            ].join(' ')}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Création en cours…
              </span>
            ) : (
              'Créer mon compte'
            )}
          </button>
        </form>
      </div>

      <div className="text-center text-sm text-white/40">
        <Link href="/login" className="hover:text-white transition-colors underline underline-offset-2">
          ← Retour à la connexion
        </Link>
      </div>
    </div>
  )
}
