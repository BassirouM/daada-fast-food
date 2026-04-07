'use client'

import * as React from 'react'
import { cn } from '../utils'
import { MapPinIcon, NavigationIcon } from '../icons'
import { Button } from '../atoms/Button'

export interface MapCoords {
  lat: number
  lng: number
}

export interface DeliveryZoneGeo {
  id:   string
  name: string
  fee:  number
}

export interface MapPickerProps {
  onSelect?:     (coords: MapCoords, address?: string) => void
  defaultLat?:   number
  defaultLng?:   number
  zones?:        DeliveryZoneGeo[]
  showZones?:    boolean
  className?:    string
}

/**
 * MapPicker — shell component.
 *
 * In production, integrate with Leaflet (react-leaflet) or Mapbox GL JS.
 * The map library is NOT bundled in @daada/ui to keep the package lean.
 *
 * Usage:
 * ```tsx
 * import dynamic from 'next/dynamic'
 * const MapPicker = dynamic(() => import('@daada/ui').then(m => m.MapPicker), { ssr: false })
 * ```
 *
 * Then swap this shell for a real map implementation.
 */
export function MapPicker({
  onSelect,
  defaultLat = 10.5917,
  defaultLng = 14.3167,
  zones = [],
  showZones = true,
  className,
}: MapPickerProps) {
  const [coords, setCoords]   = React.useState<MapCoords>({ lat: defaultLat, lng: defaultLng })
  const [address, setAddress] = React.useState<string>('')
  const [locating, setLocating] = React.useState(false)

  async function handleGeolocate() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCoords(c)
        setLocating(false)
        onSelect?.(c, address)
      },
      () => setLocating(false)
    )
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Map placeholder */}
      <div
        className={cn(
          'relative w-full h-64 rounded-2xl overflow-hidden',
          'bg-[var(--bg-elevated)] border border-[var(--border)]',
          'flex items-center justify-center'
        )}
        role="img"
        aria-label="Sélectionner une localisation sur la carte"
      >
        {/* Background grid pattern (placeholder) */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="flex flex-col items-center gap-3 relative">
          <MapPinIcon size={48} className="text-[var(--brand)]" />
          <p className="text-sm text-[var(--text-muted)] text-center px-4">
            Carte interactive — intégration Leaflet / Mapbox requise
          </p>
          <p className="text-xs text-[var(--text-muted)] font-mono">
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </p>
        </div>
      </div>

      {/* Address input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPinIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Quartier, rue, point de repère…"
            aria-label="Adresse de livraison"
            className={cn(
              'w-full h-11 pl-9 pr-4 rounded-xl',
              'bg-[var(--bg-input)] text-[var(--text-primary)] text-sm',
              'border border-[var(--border)]',
              'placeholder:text-[var(--text-muted)]',
              'focus:outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-glow)]',
              'transition-[border-color,box-shadow] duration-[120ms]'
            )}
          />
        </div>
        <Button
          variant="secondary"
          size="md"
          loading={locating}
          onClick={handleGeolocate}
          aria-label="Me géolocaliser"
        >
          <NavigationIcon size={16} />
        </Button>
      </div>

      {/* Zone selector */}
      {showZones && zones.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-[var(--text-muted)]">Zone de livraison</p>
          <div className="flex flex-col gap-1">
            {zones.map((z) => (
              <div
                key={z.id}
                className="flex justify-between px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-sm"
              >
                <span className="text-[var(--text-primary)]">{z.name}</span>
                <span className="text-[var(--brand)] font-semibold">
                  {z.fee === 0 ? 'Gratuit' : `${z.fee.toLocaleString('fr-FR')} FCFA`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm */}
      <Button
        fullWidth
        onClick={() => onSelect?.(coords, address)}
      >
        <MapPinIcon size={16} /> Confirmer cette adresse
      </Button>
    </div>
  )
}
