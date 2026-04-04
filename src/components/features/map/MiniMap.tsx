'use client'

import dynamic from 'next/dynamic'
import type { AdresseLivraison } from '@/stores/cart.store'
import { formatPrice } from '@/lib/utils'

const MapboxMap = dynamic(() => import('./MapboxMap'), { ssr: false, loading: () => (
  <div style={{ width: '100%', height: 180, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
    Chargement de la carte…
  </div>
)})

type MiniMapProps = {
  adresse: AdresseLivraison
  className?: string
}

export default function MiniMap({ adresse, className = '' }: MiniMapProps) {
  return (
    <div className={className}>
      <MapboxMap
        mode="minimap"
        initialCoords={[adresse.lng, adresse.lat]}
      />
      <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            📍 {adresse.label}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {adresse.quartier}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '0.5rem' }}>
          <p style={{ color: 'var(--brand)', fontWeight: 600, fontSize: '0.8125rem' }}>
            ~{adresse.tempsEstime} min
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            {formatPrice(adresse.fraisLivraison)}
          </p>
        </div>
      </div>
    </div>
  )
}
