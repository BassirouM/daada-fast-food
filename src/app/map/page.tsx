'use client'

import { Suspense, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import type { AdresseLivraison } from '@/stores/cart.store'

// ─── Dynamic import — Mapbox GL JS must not run on server ─────────────────────

const MapboxMap = dynamic(
  () => import('@/components/features/map/MapboxMap'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-base)',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '3px solid rgba(255,107,0,0.2)',
            borderTopColor: '#FF6B00',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Chargement de la carte…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    ),
  }
)

// ─── Inner page (uses useSearchParams — must be inside Suspense) ──────────────

function MapPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const orderId = searchParams.get('orderId') ?? undefined
  const returnUrl = searchParams.get('returnUrl') ?? '/cart'
  const mode = orderId ? 'tracking' : 'selection'

  const handleAddressConfirm = useCallback(
    (_addr: AdresseLivraison) => {
      // Navigate back with address saved in store
      router.push(returnUrl)
    },
    [router, returnUrl]
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Top bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          background: 'linear-gradient(to bottom, rgba(10,10,10,0.85) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            pointerEvents: 'auto',
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(10,10,10,0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white',
            fontSize: '1.125rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            flexShrink: 0,
          }}
        >
          ←
        </button>
        <div style={{ pointerEvents: 'auto' }}>
          <p style={{ color: 'white', fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.2 }}>
            {mode === 'tracking' ? '🏍 Suivi de livraison' : '📍 Choisir une adresse'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
            {mode === 'tracking' ? `Commande #${orderId?.slice(0, 8)}…` : 'Maroua, Cameroun'}
          </p>
        </div>
      </div>

      {/* Full-screen map */}
      <MapboxMap
        mode={mode}
        {...(orderId ? { orderId } : {})}
        onAddressConfirm={handleAddressConfirm}
        className="w-full h-full"
      />
    </div>
  )
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-base)',
          }}
        >
          <div style={{ fontSize: '2rem' }}>🗺️</div>
        </div>
      }
    >
      <MapPageInner />
    </Suspense>
  )
}
