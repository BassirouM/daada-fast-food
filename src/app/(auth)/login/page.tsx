'use client'

import type { Metadata } from 'next'
import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ─── Regex validation numéro camerounais ─────────────────────────────────────

const PHONE_CM_REGEX = /^(6[5-9]|2[2-3])\d{7}$/

function isValidPhone(digits: string): boolean {
  return PHONE_CM_REGEX.test(digits)
}

// ─── Composant PhoneInput intégré ────────────────────────────────────────────

function PhoneInputField({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  const isValid   = isValidPhone(value)
  const isDirty   = value.length > 0
  const isInvalid = isDirty && value.length >= 9 && !isValid

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="phone" className="text-sm font-medium text-white/80">
        Numéro de téléphone
      </label>
      <div
        className={[
          'flex items-center rounded-2xl border-2 overflow-hidden transition-all duration-150',
          isInvalid
            ? 'border-red-500 bg-red-500/10'
            : isValid
            ? 'border-[#FF6B00] bg-white/10'
            : 'border-white/20 bg-white/10 focus-within:border-[#FF6B00]',
        ].join(' ')}
      >
        {/* Préfixe fixe +237 */}
        <div className="flex items-center gap-1.5 px-4 py-3.5 border-r border-white/20 shrink-0">
          <span className="text-base leading-none" aria-hidden>🇨🇲</span>
          <span className="text-sm font-semibold text-white/70">+237</span>
        </div>

        {/* Saisie */}
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '').slice(0, 9)
            onChange(raw)
          }}
          placeholder="6XXXXXXXX"
          disabled={disabled}
          maxLength={9}
          autoComplete="tel-national"
          aria-label="Numéro de téléphone camerounais"
          aria-invalid={isInvalid}
          aria-describedby={isInvalid ? 'phone-error' : undefined}
          className="flex-1 bg-transparent px-4 py-3.5 text-base text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50"
        />

        {/* Indicateur validité */}
        {isDirty && (
          <span className="pr-4" aria-hidden>
            {isValid
              ? <span className="text-[#FF6B00] text-lg">✓</span>
              : isInvalid
              ? <span className="text-red-400 text-lg">✗</span>
              : null
            }
          </span>
        )}
      </div>

      {isInvalid && (
        <p id="phone-error" role="alert" className="text-xs text-red-400">
          Numéro invalide. Exemple : 677 123 456
        </p>
      )}

      <p className="text-xs text-white/40">
        MTN (67x, 68x, 69x) ou Orange (65x, 66x)
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()

  const [phone,   setPhone]   = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error,   setError]   = React.useState('')

  const isValid = isValidPhone(phone)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || loading) return

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ telephone: phone }),
      })
      const data = await res.json() as {
        success?: boolean
        maskedPhone?: string
        expiresIn?: number
        error?: string
      }

      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de l\'envoi du SMS.')
        return
      }

      // Stocker le numéro masqué pour la page verify
      sessionStorage.setItem('auth:phone', `+237${phone}`)
      sessionStorage.setItem('auth:maskedPhone', data.maskedPhone ?? '')
      sessionStorage.setItem('auth:expiresIn', String(data.expiresIn ?? 300))

      router.push('/verify')
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

      {/* Card */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl">
        <h1 className="text-xl font-bold text-white mb-1">Connexion</h1>
        <p className="text-sm text-white/50 mb-6">
          Entrez votre numéro MTN ou Orange pour recevoir un code SMS.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <PhoneInputField value={phone} onChange={setPhone} disabled={loading} />

          {error && (
            <div
              role="alert"
              className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            aria-busy={loading}
            className={[
              'w-full py-4 rounded-2xl text-sm font-bold transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
              isValid && !loading
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
                Envoi en cours…
              </span>
            ) : (
              'Recevoir mon code SMS'
            )}
          </button>
        </form>
      </div>

      {/* Liens secondaires */}
      <div className="flex flex-col items-center gap-3 text-sm text-white/50">
        <Link
          href="/email"
          className="hover:text-white transition-colors duration-100 underline underline-offset-2"
        >
          Utiliser mon email
        </Link>
        <div className="flex items-center gap-2">
          <span>Nouveau sur Daada ?</span>
          <Link
            href="/register"
            className="text-[#FF6B00] font-semibold hover:text-[#FF8C00] transition-colors duration-100"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  )
}
