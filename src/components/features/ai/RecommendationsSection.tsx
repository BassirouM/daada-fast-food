'use client'

/**
 * Section "Rien que pour toi 🎯"
 *
 * - Fetch /api/ai/recommendations via SWR
 * - Skeleton pendant le chargement
 * - Cards avec tag raison coloré
 * - Tags prédéfinis mappés depuis la raison
 */

import useSWR from 'swr'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import type { Recommendation } from '@/services/ai/recommendations'

// ─── Fetcher ─────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json()) as Promise<{ recommendations: Recommendation[] }>

// ─── Reason tag style ─────────────────────────────────────────────────────────

function getTagStyle(reason: string): { bg: string; color: string } {
  const r = reason.toLowerCase()
  if (r.includes('préféré') || r.includes('preferé') || r.includes('🔥')) {
    return { bg: 'rgba(249,115,22,0.18)', color: '#F97316' }
  }
  if (r.includes('populaire') || r.includes('📈')) {
    return { bg: 'rgba(139,92,246,0.18)', color: '#8B5CF6' }
  }
  if (r.includes('quartier') || r.includes('⭐')) {
    return { bg: 'rgba(16,185,129,0.18)', color: '#10B981' }
  }
  if (r.includes('nouveau') || r.includes('✨')) {
    return { bg: 'rgba(59,130,246,0.18)', color: '#3B82F6' }
  }
  return { bg: 'rgba(249,115,22,0.12)', color: '#FB923C' }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RecoSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="animate-shimmer"
          style={{
            height: 220,
            borderRadius: 16,
            background: 'var(--bg-surface)',
          }}
        />
      ))}
    </div>
  )
}

// ─── Recommendation card ──────────────────────────────────────────────────────

function RecoCard({ reco }: { reco: Recommendation }) {
  const tagStyle = getTagStyle(reco.reason)

  return (
    <div
      style={{
        background:   'var(--bg-surface)',
        borderRadius: 16,
        overflow:     'hidden',
        border:       '1px solid var(--border)',
        display:      'flex',
        flexDirection:'column',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 120, overflow: 'hidden', flexShrink: 0 }}>
        {reco.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={reco.imageUrl}
            alt={reco.nom}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #F97316, #EA580C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem',
          }}>
            🍔
          </div>
        )}

        {/* Reason tag */}
        <div style={{
          position:     'absolute',
          bottom:       8,
          left:         8,
          right:        8,
        }}>
          <span style={{
            display:      'inline-block',
            fontSize:     '0.625rem',
            fontWeight:   700,
            padding:      '3px 7px',
            borderRadius: 999,
            background:   tagStyle.bg,
            color:        tagStyle.color,
            border:       `1px solid ${tagStyle.color}40`,
            backdropFilter: 'blur(8px)',
            whiteSpace:   'nowrap',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            maxWidth:     '100%',
          }}>
            {reco.reason}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0.625rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <p style={{
          fontSize:     '0.8125rem',
          fontWeight:   600,
          color:        'var(--text-primary)',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
          marginBottom: 8,
        }}>
          {reco.nom}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand)' }}>
            {formatPrice(reco.prix)}
          </span>
          <Link
            href={`/menu?focus=${reco.menuId}`}
            style={{
              width:           28,
              height:          28,
              borderRadius:    '50%',
              background:      'var(--brand)',
              color:           'white',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              fontSize:        '1.125rem',
              fontWeight:      700,
              textDecoration:  'none',
              flexShrink:      0,
            }}
            aria-label={`Commander ${reco.nom}`}
          >
            +
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function RecommendationsSection() {
  const { data, isLoading, error } = useSWR(
    '/api/ai/recommendations',
    fetcher,
    {
      revalidateOnFocus:     false,
      dedupingInterval:      1800_000, // 30 min
      errorRetryCount:       1,
    }
  )

  // Masquer si erreur ou liste vide
  if (!isLoading && (!data?.recommendations?.length || error)) return null

  return (
    <section style={{ padding: '2rem 0' }}>
      <div className="container">
        {/* En-tête */}
        <div style={{ marginBottom: '1rem' }}>
          <h2
            className="font-display"
            style={{ fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: 4 }}
          >
            Rien que pour toi 🎯
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Sélectionnés par notre IA selon tes goûts
          </p>
        </div>

        {/* Grille */}
        {isLoading
          ? <RecoSkeleton />
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {data!.recommendations.map((reco) => (
                <RecoCard key={reco.menuId} reco={reco} />
              ))}
            </div>
          )
        }
      </div>
    </section>
  )
}
