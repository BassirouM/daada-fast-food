'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const WHATSAPP_NUMBER = '237677000000' // À remplacer par le vrai numéro support
const WHATSAPP_MSG    = encodeURIComponent('Bonjour, j\'ai un problème avec mon paiement Daada Fast Food.')

// ─── Error SVG illustration ───────────────────────────────────────────────────

function ErrorIllustration() {
  return (
    <svg viewBox="0 0 120 120" width={120} height={120} xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '1.5rem' }}>
      <circle cx="60" cy="60" r="58" fill="none" stroke="#EF4444" strokeWidth="3" strokeOpacity="0.2"/>
      <circle cx="60" cy="60" r="46" fill="rgba(239,68,68,0.08)"/>
      <circle cx="60" cy="60" r="34" fill="rgba(239,68,68,0.12)"/>
      {/* X mark */}
      <line x1="43" y1="43" x2="77" y2="77" stroke="#EF4444" strokeWidth="5" strokeLinecap="round"/>
      <line x1="77" y1="43" x2="43" y2="77" stroke="#EF4444" strokeWidth="5" strokeLinecap="round"/>
      {/* Decorative dots */}
      <circle cx="20" cy="25" r="4" fill="#EF4444" opacity="0.3"/>
      <circle cx="100" cy="30" r="3" fill="#EF4444" opacity="0.2"/>
      <circle cx="15" cy="85" r="3" fill="#EF4444" opacity="0.25"/>
      <circle cx="108" cy="80" r="4" fill="#EF4444" opacity="0.2"/>
    </svg>
  )
}

// ─── Inner page ───────────────────────────────────────────────────────────────

function EchecPageInner() {
  const searchParams = useSearchParams()
  const commandeId   = searchParams.get('commande_id')
  const reason       = searchParams.get('reason') ?? 'Le paiement a été refusé ou annulé.'

  return (
    <div
      style={{
        minHeight:      '100vh',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        background:     'var(--bg-base)',
        padding:        '2rem 1.5rem',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <ErrorIllustration />

        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Paiement échoué
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '0.375rem', lineHeight: 1.5 }}>
          {reason}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '2rem' }}>
          Votre commande n&apos;a pas été validée. Aucun montant n&apos;a été débité.
        </p>

        {/* Causes fréquentes */}
        <div
          style={{
            background:   'var(--bg-surface)',
            border:       '1px solid var(--border)',
            borderRadius: 16,
            padding:      '1rem',
            marginBottom: '1.5rem',
            textAlign:    'left',
          }}
        >
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.625rem' }}>
            Causes fréquentes :
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {[
              '💰 Solde insuffisant sur le compte',
              '📱 Numéro Mobile Money incorrect',
              '⏱ Délai de confirmation dépassé',
              '🔒 Transaction bloquée par l\'opérateur',
            ].map((item) => (
              <li key={item} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.375rem', alignItems: 'flex-start' }}>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Retry */}
          <Link
            href={commandeId ? `/checkout` : '/checkout'}
            style={{
              display:        'block',
              padding:        '0.875rem',
              borderRadius:   14,
              background:     'linear-gradient(135deg, #F97316, #EA580C)',
              color:          'white',
              fontWeight:     700,
              fontSize:       '1rem',
              textDecoration: 'none',
              textAlign:      'center',
              boxShadow:      '0 4px 20px rgba(249,115,22,0.4)',
            }}
          >
            🔄 Réessayer le paiement
          </Link>

          {/* WhatsApp support */}
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '0.5rem',
              padding:        '0.75rem',
              borderRadius:   14,
              border:         '1.5px solid #25D366',
              background:     'rgba(37,211,102,0.06)',
              color:          '#25D366',
              fontWeight:     600,
              fontSize:       '0.9375rem',
              textDecoration: 'none',
              textAlign:      'center',
            }}
          >
            <span style={{ fontSize: '1.125rem' }}>💬</span>
            Contacter le support WhatsApp
          </a>

          {/* Back to menu */}
          <Link
            href="/menu"
            style={{
              display:        'block',
              padding:        '0.75rem',
              borderRadius:   14,
              border:         '1.5px solid var(--border)',
              color:          'var(--text-muted)',
              fontWeight:     500,
              fontSize:       '0.875rem',
              textDecoration: 'none',
              textAlign:      'center',
            }}
          >
            Retour au menu
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function PaiementEchecPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ fontSize: '2rem' }}>✗</div>
      </div>
    }>
      <EchecPageInner />
    </Suspense>
  )
}
