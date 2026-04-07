'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import type { UserDB } from '@/types'

type Mode = 'login' | 'register' | 'reset'

export default function EmailPage() {
  const router     = useRouter()
  const setSession = useAuthStore((s) => s.setSession)

  const [mode,      setMode]      = React.useState<Mode>('login')
  const [email,     setEmail]     = React.useState('')
  const [password,  setPassword]  = React.useState('')
  const [firstName, setFirstName] = React.useState('')
  const [lastName,  setLastName]  = React.useState('')
  const [showPass,  setShowPass]  = React.useState(false)
  const [loading,   setLoading]   = React.useState(false)
  const [error,     setError]     = React.useState('')
  const [resetSent, setResetSent] = React.useState(false)

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const isPassValid  = password.length >= 8
  const isNameValid  = firstName.trim().length > 0 && lastName.trim().length > 0

  const canSubmit =
    isEmailValid &&
    (mode === 'reset' || (isPassValid && (mode === 'login' || isNameValid)))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || loading) return
    setError('')
    setLoading(true)

    try {
      if (mode === 'reset') {
        const res = await fetch('/api/auth/email/reset', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email: email.trim() }),
        })
        if (res.ok) { setResetSent(true) }
        else {
          const d = await res.json() as { error?: string }
          setError(d.error ?? 'Erreur lors de l\'envoi.')
        }
        return
      }

      const endpoint = mode === 'login'
        ? '/api/auth/email/login'
        : '/api/auth/email/register'

      const body: Record<string, string> = {
        email:    email.trim(),
        password,
      }
      if (mode === 'register') {
        body['firstName'] = firstName.trim()
        body['lastName']  = lastName.trim()
      }

      const res = await fetch(endpoint, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(body),
      })
      const data = await res.json() as {
        user?: UserDB; accessToken?: string; expiresAt?: number; error?: string
      }

      if (!res.ok) {
        setError(data.error ?? 'Une erreur est survenue.')
        return
      }

      if (data.user && data.accessToken && data.expiresAt) {
        setSession({ user: data.user, accessToken: data.accessToken, expiresAt: data.expiresAt })
        router.replace('/menu')
      }
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  // ── Reset envoyé ──────────────────────────────────────────────────────────

  if (resetSent) {
    return (
      <div className="flex flex-col gap-6" style={{ animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1) both' }}>
        <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }`}</style>
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl text-center flex flex-col gap-4">
          <span className="text-5xl" aria-hidden>📧</span>
          <h1 className="text-xl font-bold text-white">Email envoyé</h1>
          <p className="text-sm text-white/50">
            Un lien de réinitialisation a été envoyé à{' '}
            <strong className="text-white">{email}</strong>.
            Vérifiez votre boîte de réception.
          </p>
          <button
            type="button"
            onClick={() => { setResetSent(false); setMode('login') }}
            className="mt-2 text-sm text-[#FF6B00] font-semibold hover:text-[#FF8C00]"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    )
  }

  // ── Formulaire ────────────────────────────────────────────────────────────

  const title = mode === 'login' ? 'Connexion' : mode === 'register' ? 'Inscription' : 'Mot de passe oublié'

  return (
    <div className="flex flex-col gap-6" style={{ animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1) both' }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Toggle login / register */}
      {mode !== 'reset' && (
        <div className="flex rounded-2xl overflow-hidden border border-white/10 bg-white/5 p-0.5">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError('') }}
              aria-pressed={mode === m}
              className={[
                'flex-1 h-10 rounded-xl text-sm font-medium transition-all duration-150',
                mode === m
                  ? 'bg-[#FF6B00] text-white shadow'
                  : 'text-white/50 hover:text-white',
              ].join(' ')}
            >
              {m === 'login' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl">
        <h1 className="text-xl font-bold text-white mb-5">{title}</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Prénom + Nom (register) */}
          {mode === 'register' && (
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1.5">
                <label htmlFor="firstName" className="text-xs font-medium text-white/60">Prénom</label>
                <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Aminatou" maxLength={50} autoComplete="given-name" disabled={loading} required
                  className="h-11 px-3 rounded-xl text-sm text-white bg-white/10 border-2 border-white/20 placeholder:text-white/30 focus:outline-none focus:border-[#FF6B00] disabled:opacity-50 transition-colors" />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label htmlFor="lastName" className="text-xs font-medium text-white/60">Nom</label>
                <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  placeholder="Moussa" maxLength={50} autoComplete="family-name" disabled={loading} required
                  className="h-11 px-3 rounded-xl text-sm text-white bg-white/10 border-2 border-white/20 placeholder:text-white/30 focus:outline-none focus:border-[#FF6B00] disabled:opacity-50 transition-colors" />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-white/80">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
              maxLength={254}
              autoComplete="email"
              disabled={loading}
              aria-invalid={email.length > 0 && !isEmailValid}
              className={[
                'h-12 px-4 rounded-2xl text-sm text-white bg-white/10 border-2 placeholder:text-white/30 focus:outline-none disabled:opacity-50 transition-colors',
                email.length > 0 && !isEmailValid
                  ? 'border-red-500'
                  : 'border-white/20 focus:border-[#FF6B00]',
              ].join(' ')}
            />
          </div>

          {/* Mot de passe (pas pour reset) */}
          {mode !== 'reset' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-white/80">Mot de passe</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('reset'); setError('') }}
                    className="text-xs text-[#FF6B00] hover:text-[#FF8C00] transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Minimum 8 caractères' : '••••••••'}
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  disabled={loading}
                  className="w-full h-12 pl-4 pr-12 rounded-2xl text-sm text-white bg-white/10 border-2 border-white/20 placeholder:text-white/30 focus:outline-none focus:border-[#FF6B00] disabled:opacity-50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {mode === 'register' && password.length > 0 && !isPassValid && (
                <p className="text-xs text-red-400">Minimum 8 caractères requis.</p>
              )}
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div role="alert" className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || loading}
            aria-busy={loading}
            className={[
              'w-full py-4 rounded-2xl text-sm font-bold transition-all duration-150 mt-1',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]',
              canSubmit && !loading
                ? 'bg-[#FF6B00] text-white hover:bg-[#FF8C00] active:scale-[0.98] shadow-lg shadow-orange-500/30'
                : 'bg-white/10 text-white/30 cursor-not-allowed',
            ].join(' ')}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {mode === 'reset' ? 'Envoi…' : 'Chargement…'}
              </span>
            ) : mode === 'login'    ? 'Se connecter'
              : mode === 'register' ? 'Créer mon compte'
              : 'Envoyer le lien de réinitialisation'
            }
          </button>
        </form>
      </div>

      {/* Lien vers SMS */}
      <div className="text-center text-sm text-white/40">
        <Link href="/login" className="hover:text-white transition-colors underline underline-offset-2">
          ← Connexion par SMS
        </Link>
      </div>
    </div>
  )
}
