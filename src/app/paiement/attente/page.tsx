'use client'

/**
 * Page /paiement/attente
 * Affichée pendant le traitement du paiement Mobile Money.
 *
 * - Spinner CSS orange animé
 * - Polling toutes les 3 secondes via /api/payment/status?tx=...
 * - Redirection automatique vers /paiement/succes ou /paiement/echec
 * - Timeout de 5 minutes avec message d'erreur
 */

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type PollStatut = 'PENDING' | 'ACCEPTED' | 'REFUSED' | 'CANCELLED' | 'TIMEOUT' | 'ERROR'

const POLL_INTERVAL_MS = 3000
const TIMEOUT_MS       = 5 * 60 * 1000 // 5 minutes

function PaiementAttenteInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const tx           = searchParams.get('tx') ?? ''

  const [statut,  setStatut]  = useState<PollStatut>('PENDING')
  const [attempt, setAttempt] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  const startRef    = useRef(Date.now())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Polling ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!tx) {
      setStatut('ERROR')
      return
    }

    const poll = async () => {
      const now = Date.now()
      setElapsed(Math.floor((now - startRef.current) / 1000))

      // Timeout global
      if (now - startRef.current > TIMEOUT_MS) {
        setStatut('TIMEOUT')
        if (intervalRef.current) clearInterval(intervalRef.current)
        return
      }

      try {
        const res  = await fetch(`/api/payment/status?tx=${encodeURIComponent(tx)}`)
        const data = await res.json() as { statut?: PollStatut }

        setAttempt((a) => a + 1)

        if (!data.statut || data.statut === 'PENDING') return

        setStatut(data.statut)
        if (intervalRef.current) clearInterval(intervalRef.current)

        // Redirection après 1.5s
        const delay = 1500
        if (data.statut === 'ACCEPTED') {
          setTimeout(() => router.push(`/paiement/succes?tx=${tx}`), delay)
        } else {
          setTimeout(() => router.push(`/paiement/echec?tx=${tx}&reason=${data.statut}`), delay)
        }
      } catch {
        // Erreur réseau — on continue à poller
        setAttempt((a) => a + 1)
      }
    }

    // Premier poll immédiat
    poll()
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [tx, router])

  // ── Rendu ─────────────────────────────────────────────────────────────────

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="flex flex-col items-center gap-8 max-w-sm w-full text-center">

        {/* ── Icône état ── */}
        {statut === 'PENDING' && (
          <>
            {/* Spinner CSS orange */}
            <div className="relative w-24 h-24">
              <div
                className="absolute inset-0 rounded-full border-4 border-[var(--border)] opacity-30"
              />
              <div
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--brand)] animate-spin"
                style={{ animationDuration: '1s' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="text-[var(--brand)]">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">
                Traitement en cours...
              </h1>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                Votre paiement Mobile Money est en cours de vérification.
                Confirme la demande sur ton téléphone si tu ne l&apos;as pas encore fait.
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[var(--border)] rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-[var(--brand)] rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (elapsed / (TIMEOUT_MS / 1000)) * 100)}%` }}
              />
            </div>

            <p className="text-[var(--text-muted)] text-xs tabular-nums">
              {timeStr} — tentative {attempt}
            </p>
          </>
        )}

        {(statut === 'ACCEPTED') && (
          <>
            <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="text-green-500">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">Paiement accepté !</h1>
              <p className="text-[var(--text-secondary)] text-sm">Redirection en cours...</p>
            </div>
          </>
        )}

        {(statut === 'REFUSED' || statut === 'CANCELLED') && (
          <>
            <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="text-red-500">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">
                {statut === 'CANCELLED' ? 'Paiement annulé' : 'Paiement refusé'}
              </h1>
              <p className="text-[var(--text-secondary)] text-sm">Redirection en cours...</p>
            </div>
          </>
        )}

        {statut === 'TIMEOUT' && (
          <>
            <div className="w-24 h-24 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="text-yellow-500">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">Délai dépassé</h1>
              <p className="text-[var(--text-secondary)] text-sm">
                Nous n&apos;avons pas reçu de confirmation dans les 5 minutes.
                Si le montant a été débité, contacte le support.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => router.push('/orders')}
                className="w-full py-3 rounded-xl bg-[var(--brand)] text-white font-semibold
                  active:scale-95 transition-transform"
              >
                Voir mes commandes
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full py-3 rounded-xl border border-[var(--border)] text-[var(--text-secondary)]
                  active:scale-95 transition-transform"
              >
                Retour à l&apos;accueil
              </button>
            </div>
          </>
        )}

        {statut === 'ERROR' && (
          <>
            <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="text-red-500">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">Erreur</h1>
              <p className="text-[var(--text-secondary)] text-sm">
                Paramètre de transaction manquant.
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 rounded-xl bg-[var(--brand)] text-white font-semibold
                active:scale-95 transition-transform"
            >
              Retour à l&apos;accueil
            </button>
          </>
        )}

      </div>
    </main>
  )
}

export default function PaiementAttentePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="w-12 h-12 rounded-full border-4 border-transparent border-t-[var(--brand)] animate-spin" />
      </main>
    }>
      <PaiementAttenteInner />
    </Suspense>
  )
}
