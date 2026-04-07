'use client'

import * as React from 'react'
import { cn } from '../utils'
import { TruckIcon, MapPinIcon } from '../icons'
import { ETA } from '../molecules/ETA'

export interface DriverTrackerProps {
  orderId:        string
  driverLat?:     number
  driverLng?:     number
  restaurantLat?: number
  restaurantLng?: number
  clientLat?:     number
  clientLng?:     number
  eta?:           number
  route?:         Record<string, unknown> | null   // GeoJSON FeatureCollection
  driverName?:    string
  driverPhone?:   string
  driverAvatar?:  string
  className?:     string
}

/**
 * DriverTracker — shell component.
 *
 * The live map visualization requires a mapping library (Leaflet / Mapbox).
 * This component provides:
 * - Driver info panel
 * - ETA display
 * - Placeholder for the map canvas
 * - Contact button
 *
 * Wire up with real-time Supabase subscription on orders:
 * `driver_locations:order_id=eq.{orderId}`
 */
export function DriverTracker({
  driverLat,
  driverLng,
  eta = 15,
  driverName,
  driverPhone,
  className,
}: DriverTrackerProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Map area */}
      <div
        className="relative w-full h-56 rounded-2xl overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center"
        role="img"
        aria-label="Carte de suivi du livreur"
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative flex flex-col items-center gap-2">
          <TruckIcon size={40} className="text-[var(--brand)]" />
          <p className="text-xs text-[var(--text-muted)]">
            {driverLat
              ? `${driverLat.toFixed(4)}, ${driverLng?.toFixed(4)}`
              : 'Position du livreur…'}
          </p>
        </div>

        {/* Live indicator */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--brand)] text-white text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          EN DIRECT
        </div>

        {/* ETA overlay */}
        <div className="absolute bottom-3 right-3">
          <ETA minutes={eta} isLive className="shadow-[var(--shadow-md)]" />
        </div>
      </div>

      {/* Driver info */}
      {(driverName || driverPhone) && (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)]">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
            <TruckIcon size={20} className="text-[var(--brand)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {driverName ?? 'Votre livreur'}
            </p>
            <p className="text-xs text-[var(--text-muted)]">Livreur Daada</p>
          </div>
          {driverPhone && (
            <a
              href={`tel:${driverPhone}`}
              aria-label={`Appeler ${driverName ?? 'le livreur'}`}
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-xl',
                'bg-[var(--brand-subtle)] text-[var(--brand)]',
                'hover:bg-[var(--brand)] hover:text-white',
                'transition-colors duration-100'
              )}
            >
              📞
            </a>
          )}
        </div>
      )}

      {/* Delivery steps */}
      <div className="flex items-center justify-between px-2">
        {[
          { icon: '🏪', label: 'Restaurant' },
          { icon: '🚴', label: 'En route' },
          { icon: '📍', label: 'Chez vous' },
        ].map((step, i) => (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">{step.icon}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{step.label}</span>
            </div>
            {i < 2 && (
              <div className="flex-1 h-px mx-2 bg-[var(--border)]">
                {i === 0 && (
                  <div className="h-full w-full bg-[var(--brand)] animate-pulse" />
                )}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
