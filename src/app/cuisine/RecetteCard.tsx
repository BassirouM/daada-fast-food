'use client'

import Image from 'next/image'

type Recette = {
  id: string
  titre: string
  imageUrl: string
  difficulte: 'Facile' | 'Moyen' | 'Difficile'
  tempTotal: number
  tier: 'free' | 'premium'
  categorie: string
}

const DIFFICULTE_COLOR: Record<Recette['difficulte'], string> = {
  Facile:    'var(--success)',
  Moyen:     'var(--warning)',
  Difficile: 'var(--danger)',
}

export function RecetteCard({ recette }: { recette: Recette }) {
  const isPremium = recette.tier === 'premium'

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 20,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 200, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
        <Image
          src={recette.imageUrl}
          alt={recette.titre}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          style={{
            objectFit: 'cover',
            filter: isPremium ? 'blur(6px) brightness(0.8)' : 'none',
            transition: 'transform 0.3s ease',
          }}
        />

        {/* Badge tier */}
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 10px',
              borderRadius: 999,
              fontSize: '0.6875rem',
              fontWeight: 700,
              background: isPremium
                ? 'linear-gradient(135deg, var(--accent-dark), var(--accent))'
                : 'var(--success)',
              color: 'white',
            }}
          >
            {isPremium ? '✨ PREMIUM' : '✓ GRATUIT'}
          </span>
        </div>

        {/* Premium lock overlay */}
        {isPremium && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.25)',
            }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.92)',
                borderRadius: 14,
                padding: '10px 20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🔓</div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1F2937' }}>
                Débloquer la recette
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '1rem' }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          {recette.categorie}
        </p>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 10 }}>
          {recette.titre}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: DIFFICULTE_COLOR[recette.difficulte] }}>
            {recette.difficulte}
          </span>
          <span style={{ color: 'var(--border-strong)', fontSize: '0.75rem' }}>•</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            🕐 {recette.tempTotal} min
          </span>
        </div>
      </div>
    </div>
  )
}
