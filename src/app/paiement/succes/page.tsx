'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// ─── Confetti particle ────────────────────────────────────────────────────────

type Particle = {
  id: number
  x: number
  color: string
  delay: number
  duration: number
  size: number
  rotate: number
}

function Confetti() {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id:       i,
      x:        Math.random() * 100,
      color:    ['#FF6B00', '#FF8C3A', '#FFC77A', '#FFEB99', '#10B981', '#3B82F6', '#8B5CF6'][Math.floor(Math.random() * 7)] ?? '#FF6B00',
      delay:    Math.random() * 1.2,
      duration: 2.5 + Math.random() * 2,
      size:     6 + Math.random() * 8,
      rotate:   Math.random() * 360,
    }))
  )

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position:        'absolute',
              left:            `${p.x}%`,
              top:             -20,
              width:           p.size,
              height:          p.size,
              background:      p.color,
              borderRadius:    Math.random() > 0.5 ? '50%' : 2,
              animation:       `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
              transform:       `rotate(${p.rotate}deg)`,
            }}
          />
        ))}
      </div>
    </>
  )
}

// ─── Inner page ───────────────────────────────────────────────────────────────

function SuccessPageInner() {
  const _router     = useRouter()
  const searchParams = useSearchParams()
  const commandeId  = searchParams.get('commande_id')
  const isTest      = searchParams.get('test') === '1'
  const shortId     = commandeId?.slice(0, 8).toUpperCase() ?? '—'

  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

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
        position:       'relative',
        overflow:       'hidden',
      }}
    >
      <Confetti />

      <div
        style={{
          position:  'relative',
          zIndex:    1,
          textAlign: 'center',
          maxWidth:  400,
          opacity:   visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition:'all 0.5s ease',
        }}
      >
        {/* Checkmark animation */}
        <div
          style={{
            width:          96,
            height:         96,
            borderRadius:   '50%',
            background:     'linear-gradient(135deg, #10B981, #059669)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            margin:         '0 auto 1.5rem',
            fontSize:       '3rem',
            boxShadow:      '0 8px 32px rgba(16,185,129,0.4)',
            animation:      'bounceIn 0.6s ease',
          }}
        >
          ✓
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Commande confirmée !
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Votre paiement a été accepté. Notre équipe prépare votre commande.
        </p>

        {/* Numéro commande */}
        <div
          style={{
            background:    'var(--bg-surface)',
            border:        '1px solid var(--border)',
            borderRadius:  16,
            padding:       '1.25rem',
            marginBottom:  '1.5rem',
          }}
        >
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
            Numéro de commande
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand)', letterSpacing: '0.05em', fontVariantNumeric: 'tabular-nums' }}>
            #{shortId}
          </p>
          {isTest && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
              Mode test — configurez CINETPAY_API_KEY pour le paiement réel
            </p>
          )}
        </div>

        {/* ETA */}
        <div
          style={{
            display:       'flex',
            justifyContent:'center',
            gap:           '1.5rem',
            marginBottom:  '2rem',
          }}
        >
          {[['⏱', '~30 min', 'Livraison estimée'], ['🍔', 'En préparation', 'Statut actuel'], ['📍', 'Maroua', 'Zone']].map(([icon, val, lbl]) => (
            <div key={lbl} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{val}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {commandeId && (
            <Link
              href={`/map?orderId=${commandeId}&mode=tracking`}
              style={{
                display:       'block',
                padding:       '0.875rem',
                borderRadius:  14,
                background:    'linear-gradient(135deg, #FF6B00, #CC5500)',
                color:         'white',
                fontWeight:    700,
                fontSize:      '1rem',
                textDecoration:'none',
                textAlign:     'center',
                boxShadow:     '0 4px 20px rgba(255,107,0,0.4)',
              }}
            >
              🏍 Suivre ma commande
            </Link>
          )}
          <Link
            href="/menu"
            style={{
              display:       'block',
              padding:       '0.75rem',
              borderRadius:  14,
              border:        '1.5px solid var(--border)',
              color:         'var(--text-secondary)',
              fontWeight:    600,
              fontSize:      '0.9375rem',
              textDecoration:'none',
              textAlign:     'center',
            }}
          >
            Continuer mes achats
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes bounceIn {
          0%   { transform: scale(0.3); opacity: 0; }
          50%  { transform: scale(1.1); }
          70%  { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function PaiementSuccesPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ fontSize: '2rem' }}>✓</div>
      </div>
    }>
      <SuccessPageInner />
    </Suspense>
  )
}
