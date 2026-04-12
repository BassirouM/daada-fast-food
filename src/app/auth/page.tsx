'use client'

import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { isValidTelephoneCM } from '@/lib/security/validation'

// ─── Constants ────────────────────────────────────────────────────────────────

const QUARTIERS = [
  'Domayo', 'Kakataré', 'Doualaré', 'Kongola', 'Lopéré',
  'Ouro-Tchédé', 'Pitoare', 'Dougoy', 'Founangué', 'Autres',
]

// ─── OTP Input ────────────────────────────────────────────────────────────────

function OtpInputGroup({
  value,
  onChange,
  shake,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  shake: boolean
  disabled: boolean
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.padEnd(6, '').split('').slice(0, 6)

  const focus = (i: number) => refs.current[i]?.focus()

  const handleInput = (i: number, char: string) => {
    if (!/^\d$/.test(char)) return
    const next = [...digits]
    next[i] = char
    onChange(next.join('').trimEnd())
    if (i < 5) setTimeout(() => focus(i + 1), 0)
  }

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...digits]
      if (next[i] && next[i] !== ' ') {
        next[i] = ''
        onChange(next.join('').trimEnd())
      } else if (i > 0) {
        next[i - 1] = ''
        onChange(next.join('').trimEnd())
        setTimeout(() => focus(i - 1), 0)
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      focus(i - 1)
    } else if (e.key === 'ArrowRight' && i < 5) {
      focus(i + 1)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    setTimeout(() => focus(Math.min(pasted.length, 5)), 0)
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        justifyContent: 'center',
        animation: shake ? 'authShake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)' : 'none',
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          pattern="\d"
          maxLength={1}
          value={digits[i] === ' ' ? '' : (digits[i] ?? '')}
          onChange={(e) => handleInput(i, e.target.value.slice(-1))}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          style={{
            width: 44,
            height: 52,
            textAlign: 'center',
            fontSize: '1.375rem',
            fontWeight: 700,
            borderRadius: 12,
            border: digits[i] && digits[i] !== ' '
              ? '2px solid var(--brand)'
              : '2px solid var(--border)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color 0.15s',
            caretColor: 'transparent',
          }}
        />
      ))}
    </div>
  )
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function useCountdown(initial: number) {
  const [secs, setSecs] = useState(initial)
  const active = secs > 0

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [active])

  const reset = useCallback((n: number) => setSecs(n), [])
  return { secs, active, reset }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? 0 : 24}px)`,
        opacity: visible ? 1 : 0,
        transition: 'all 0.3s ease',
        background: 'rgba(10,10,10,0.92)',
        color: 'white',
        padding: '0.625rem 1.25rem',
        borderRadius: 999,
        fontSize: '0.875rem',
        fontWeight: 500,
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
        zIndex: 9999,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {message}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Step = 'phone' | 'otp' | 'register'

function AuthPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') ?? '/'

  const { sendOtp, verifyOtp, updateProfile, isAuthenticated } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) router.replace(returnUrl)
  }, [isAuthenticated, router, returnUrl])

  // ── State ───────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpShake, setOtpShake] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Register fields
  const [nom, setNom] = useState('')
  const [quartier, setQuartier] = useState('')

  // Toast
  const [toast, setToast] = useState({ msg: '', visible: false })
  const showToast = useCallback((msg: string) => {
    setToast({ msg, visible: true })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000)
  }, [])

  // Countdown 60s
  const { secs: countdown, active: countdownActive, reset: resetCountdown } = useCountdown(0)

  // ── Phone submit ────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    setError('')
    const cleaned = phone.replace(/\s/g, '')
    if (!isValidTelephoneCM(cleaned) && !isValidTelephoneCM(`+237${cleaned}`)) {
      setError('Numéro camerounais invalide (ex: 677 123 456)')
      return
    }
    if (mode === 'register' && nom.trim().length < 2) {
      setError('Veuillez entrer votre nom complet (min. 2 caractères)')
      return
    }
    setLoading(true)
    const result = await sendOtp(cleaned)
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? 'Erreur envoi SMS')
      return
    }
    resetCountdown(60)
    setStep('otp')
  }

  // ── OTP submit ──────────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otp.length < 6) return
    if (attempts >= 3) {
      setError('Trop de tentatives. Demandez un nouveau code.')
      return
    }
    setError('')
    setLoading(true)
    const result = await verifyOtp(phone.replace(/\s/g, ''), otp)
    setLoading(false)

    if (!result.success) {
      setAttempts((a) => a + 1)
      setOtpShake(true)
      setTimeout(() => setOtpShake(false), 500)
      setOtp('')
      setError(result.error ?? 'Code invalide')
      return
    }

    if (mode === 'register') {
      // Sauvegarder le profil directement — pas d'étape 3
      setLoading(true)
      const profileData: { nom: string; quartier?: string } = { nom: nom.trim() || `Client` }
      if (quartier) profileData.quartier = quartier
      await updateProfile(profileData)
      setLoading(false)
      showToast(`Bienvenue ${profileData.nom} 👋`)
      setTimeout(() => router.replace(returnUrl), 800)
    } else if (result.isNewUser) {
      // Nouvel utilisateur en mode login — demander le nom
      setStep('register')
    } else {
      showToast('Bon retour ! 👋')
      setTimeout(() => router.replace(returnUrl), 600)
    }
  }

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (otp.length === 6 && step === 'otp') {
      void handleVerifyOtp()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp])

  // ── Register submit (mode login, nouvel utilisateur) ─────────────────────
  const handleRegister = async () => {
    if (nom.trim().length < 2) {
      setError('Le nom doit contenir au moins 2 caractères')
      return
    }
    setError('')
    setLoading(true)

    const profileData: { nom: string; quartier?: string } = { nom: nom.trim() }
    if (quartier) profileData.quartier = quartier

    const ok = await updateProfile(profileData)
    setLoading(false)
    if (!ok) {
      setError('Erreur lors de la création du profil')
      return
    }

    showToast(`Bienvenue ${nom.trim()} 👋`)
    setTimeout(() => router.replace(returnUrl), 800)
  }

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (countdownActive) return
    setOtp('')
    setAttempts(0)
    setError('')
    setLoading(true)
    await sendOtp(phone.replace(/\s/g, ''))
    setLoading(false)
    resetCountdown(60)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes authShake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-6px); }
          40%, 60% { transform: translateX(6px); }
        }
        @keyframes authFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .auth-card { animation: authFadeIn 0.35s ease both; }
        .auth-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          border: 2px solid var(--border);
          background: var(--bg-elevated);
          color: var(--text-primary);
          font-size: 1rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .auth-input:focus { border-color: var(--brand); }
        .auth-btn {
          width: 100%;
          padding: 0.875rem;
          border-radius: 14px;
          background: linear-gradient(135deg, #F97316, #EA580C);
          color: white;
          font-size: 1rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.15s;
          box-shadow: 0 4px 20px rgba(249,115,22,0.4);
        }
        .auth-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .auth-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .phone-prefix {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
          font-size: 1rem;
          font-weight: 600;
          pointer-events: none;
          user-select: none;
        }
      `}</style>

      {/* Page wrapper */}
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          background: 'var(--bg-base)',
        }}
      >
        {/* Left illustration — desktop only */}
        <div
          className="hidden md:flex"
          style={{
            width: '42%',
            background: 'linear-gradient(160deg, #F97316 0%, #EA580C 45%, #0A0A0A 100%)',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative circles */}
          {[200, 340, 480].map((size, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.08)',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
          {/* Big emoji */}
          <div style={{ fontSize: '5rem', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
            🍔
          </div>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.2,
              position: 'relative',
              zIndex: 1,
              marginBottom: '0.75rem',
            }}
          >
            Daada Fast Food
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontSize: '1rem', position: 'relative', zIndex: 1 }}>
            Livraison rapide à Maroua
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem', position: 'relative', zIndex: 1 }}>
            {[['🚀', '30 min'], ['⭐', '4.9/5'], ['🍽️', '500+ plats']].map(([icon, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{icon}</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right form */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            // Mobile: gradient background
            background: 'var(--bg-base)',
            position: 'relative',
          }}
        >
          {/* Mobile gradient header */}
          <div
            className="md:hidden"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 180,
              background: 'linear-gradient(160deg, #F97316 0%, #EA580C 60%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />

          {/* Mobile logo */}
          <div
            className="md:hidden"
            style={{
              position: 'relative',
              zIndex: 1,
              textAlign: 'center',
              marginBottom: '1.5rem',
              marginTop: '1rem',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.375rem' }}>🍔</div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'white', marginBottom: '0.25rem' }}>
              Daada Fast Food
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8125rem' }}>Livraison rapide à Maroua</p>
          </div>

          {/* Card */}
          <div
            className="auth-card"
            style={{
              width: '100%',
              maxWidth: 420,
              background: 'var(--bg-surface)',
              borderRadius: 20,
              padding: '1.75rem 1.5rem',
              boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
              border: '1px solid var(--border)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Mode toggle — only on phone step */}
            {step === 'phone' && (
              <div
                style={{
                  display: 'flex',
                  background: 'var(--bg-elevated)',
                  borderRadius: 12,
                  padding: 4,
                  marginBottom: '1.5rem',
                }}
              >
                {(['login', 'register'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError('') }}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: 9,
                      border: 'none',
                      background: mode === m ? 'var(--brand)' : 'transparent',
                      color: mode === m ? 'white' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {m === 'login' ? 'Se connecter' : "S'inscrire"}
                  </button>
                ))}
              </div>
            )}

            {/* ── Step: Phone ── */}
            {step === 'phone' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {mode === 'login' ? 'Bon retour ! 👋' : 'Créer un compte'}
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {mode === 'login'
                      ? 'Entrez votre numéro pour recevoir un code SMS'
                      : 'Commencez par entrer votre numéro de téléphone'}
                  </p>
                </div>

                <div style={{ position: 'relative' }}>
                  <span className="phone-prefix">+237</span>
                  <input
                    className="auth-input"
                    type="tel"
                    placeholder="677 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && void handleSendOtp()}
                    style={{ paddingLeft: '3.5rem' }}
                    autoComplete="tel"
                    autoFocus
                  />
                </div>

                {/* Champs inscription — affichés avant envoi OTP */}
                {mode === 'register' && (
                  <>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
                        Nom complet *
                      </label>
                      <input
                        className="auth-input"
                        type="text"
                        placeholder="Ex: Moussa Alima"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        autoComplete="name"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
                        Quartier
                      </label>
                      <select
                        className="auth-input"
                        value={quartier}
                        onChange={(e) => setQuartier(e.target.value)}
                        style={{ cursor: 'pointer' }}
                      >
                        <option value="">Choisir un quartier…</option>
                        {QUARTIERS.map((q) => (
                          <option key={q} value={q}>{q}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {error && (
                  <p style={{ fontSize: '0.8125rem', color: '#EF4444', marginTop: '-0.25rem' }}>{error}</p>
                )}

                <button
                  className="auth-btn"
                  onClick={() => void handleSendOtp()}
                  disabled={
                    loading ||
                    phone.replace(/\s/g, '').length < 9 ||
                    (mode === 'register' && nom.trim().length < 2)
                  }
                >
                  {loading ? '…' : mode === 'register' ? "Créer mon compte" : 'Recevoir le code SMS'}
                </button>

                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  En continuant, vous acceptez nos conditions d&apos;utilisation
                </p>
              </div>
            )}

            {/* ── Step: OTP ── */}
            {step === 'otp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <button
                    onClick={() => { setStep('phone'); setOtp(''); setError('') }}
                    style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: '0.875rem', cursor: 'pointer', padding: 0, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    ← Retour
                  </button>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    Code de vérification
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Code envoyé au <strong>+237 {phone}</strong>
                  </p>
                </div>

                <OtpInputGroup
                  value={otp}
                  onChange={setOtp}
                  shake={otpShake}
                  disabled={loading}
                />

                {error && (
                  <p style={{ fontSize: '0.8125rem', color: '#EF4444', textAlign: 'center' }}>
                    {error}
                    {attempts > 0 && ` (${3 - attempts} essai${3 - attempts > 1 ? 's' : ''} restant${3 - attempts > 1 ? 's' : ''})`}
                  </p>
                )}

                <button
                  className="auth-btn"
                  onClick={() => void handleVerifyOtp()}
                  disabled={loading || otp.length < 6}
                >
                  {loading ? '…' : 'Valider'}
                </button>

                <div style={{ textAlign: 'center' }}>
                  {countdownActive ? (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      Renvoyer dans <strong style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{countdown}s</strong>
                    </p>
                  ) : (
                    <button
                      onClick={() => void handleResend()}
                      style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Renvoyer le code
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Step: Register ── */}
            {step === 'register' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    Créer votre profil
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Quelques infos pour personnaliser votre expérience
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
                    Votre nom *
                  </label>
                  <input
                    className="auth-input"
                    type="text"
                    placeholder="Ex: Moussa Alima"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    autoComplete="name"
                    autoFocus
                  />
                </div>

                {/* Quartier */}
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
                    Quartier (optionnel)
                  </label>
                  <select
                    className="auth-input"
                    value={quartier}
                    onChange={(e) => setQuartier(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">Choisir un quartier…</option>
                    {QUARTIERS.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>

                {error && (
                  <p style={{ fontSize: '0.8125rem', color: '#EF4444' }}>{error}</p>
                )}

                <button
                  className="auth-btn"
                  onClick={() => void handleRegister()}
                  disabled={loading || nom.trim().length < 2}
                >
                  {loading ? '…' : 'Créer mon compte'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Toast message={toast.msg} visible={toast.visible} />
    </>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ fontSize: '2rem' }}>🍔</div>
      </div>
    }>
      <AuthPageInner />
    </Suspense>
  )
}
