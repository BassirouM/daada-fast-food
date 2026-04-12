'use client'

/**
 * WelcomeBanner — Bandeau de bienvenue personnalisé
 *
 * Meilleures pratiques :
 * - Salutation horaire (Bonjour / Bon après-midi / Bonsoir)
 * - Prénom extrait du nom complet
 * - Badge niveau fidélité (bronze / argent / or)
 * - Skeleton pendant l'hydratation Zustand (évite le flash)
 * - État invité avec CTA connexion
 * - Fade-in fluide via CSS transition
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 5)  return 'Bonne nuit'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

function getFirstName(nom: string): string {
  return nom.trim().split(/\s+/)[0] ?? nom.trim()
}

const NIVEAU_CONFIG = {
  bronze: { label: 'Bronze', color: '#CD7F32', bg: 'rgba(205,127,50,0.15)', icon: '🥉' },
  argent: { label: 'Argent', color: '#A8A9AD', bg: 'rgba(168,169,173,0.15)', icon: '🥈' },
  or:     { label: 'Or',     color: '#FFD700', bg: 'rgba(255,215,0,0.15)',   icon: '🥇' },
} as const

function AvatarCircle({ nom }: { nom: string }) {
  const initials = nom
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')

  return (
    <div
      aria-hidden="true"
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #F97316, #EA580C)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1rem',
        fontWeight: 700,
        color: 'white',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(249,115,22,0.35)',
      }}
    >
      {initials || '?'}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        className="animate-shimmer"
        style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <div className="animate-shimmer" style={{ width: 140, height: 16, borderRadius: 6 }} />
        <div className="animate-shimmer" style={{ width: 100, height: 12, borderRadius: 6 }} />
      </div>
      <div className="animate-shimmer" style={{ width: 72, height: 24, borderRadius: 999 }} />
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function WelcomeBanner() {
  const [mounted, setMounted] = useState(false)
  const { userDB, isAuthenticated } = useAuthStore()

  // Évite le mismatch SSR ↔ client pendant l'hydratation du store persisté
  useEffect(() => setMounted(true), [])

  if (!mounted) return <Skeleton />

  const greeting = getGreeting()

  // ── Invité ──────────────────────────────────────────────────────────────────
  if (!isAuthenticated || !userDB) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          padding: '0.875rem 1rem',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          animation: 'wbFadeIn 0.3s ease both',
        }}
      >
        <div>
          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {greeting} 👋
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Connectez-vous pour commander plus vite
          </p>
        </div>
        <Link
          href="/auth"
          style={{
            padding: '0.4375rem 0.875rem',
            borderRadius: 999,
            background: 'linear-gradient(135deg, #F97316, #EA580C)',
            color: 'white',
            fontSize: '0.8125rem',
            fontWeight: 700,
            textDecoration: 'none',
            flexShrink: 0,
            boxShadow: '0 2px 10px rgba(249,115,22,0.35)',
          }}
        >
          Se connecter
        </Link>
      </div>
    )
  }

  // ── Connecté ────────────────────────────────────────────────────────────────
  const prenom    = getFirstName(userDB.nom)
  const niveau    = NIVEAU_CONFIG[userDB.niveau_fidelite] ?? NIVEAU_CONFIG.bronze
  const points    = userDB.points_fidelite ?? 0

  return (
    <>
      <style>{`
        @keyframes wbFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.875rem 1rem',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          animation: 'wbFadeIn 0.35s ease both',
        }}
      >
        {/* Avatar */}
        <AvatarCircle nom={userDB.nom} />

        {/* Texte */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {greeting}, {prenom} 👋
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            {points > 0
              ? `${points} pts · Que veux-tu manger ?`
              : 'Que veux-tu manger aujourd\'hui ?'}
          </p>
        </div>

        {/* Badge niveau fidélité */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.3125rem 0.625rem',
            borderRadius: 999,
            background: niveau.bg,
            border: `1px solid ${niveau.color}40`,
            flexShrink: 0,
          }}
          title={`Niveau ${niveau.label} — ${points} points`}
        >
          <span style={{ fontSize: '0.875rem' }}>{niveau.icon}</span>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: niveau.color }}>
            {niveau.label}
          </span>
        </div>
      </div>
    </>
  )
}
