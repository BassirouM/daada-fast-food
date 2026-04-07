'use client'

import * as React from 'react'
import { cn } from '../utils'
import { MapPinIcon, PhoneIcon, CheckCircleIcon, NavigationIcon } from '../icons'
import { WhatsappIcon, StarIcon } from '../icons'
import { Badge } from '../atoms/Badge'

export type StoreType = 'epicerie' | 'marche' | 'supermarche' | 'grossiste' | 'producteur'

const storeTypeLabels: Record<StoreType, string> = {
  epicerie:     'Épicerie',
  marche:       'Marché',
  supermarche:  'Supermarché',
  grossiste:    'Grossiste',
  producteur:   'Producteur',
}

const storeTypeEmoji: Record<StoreType, string> = {
  epicerie:     '🛒',
  marche:       '🏪',
  supermarche:  '🏬',
  grossiste:    '📦',
  producteur:   '🌿',
}

export interface GroceryStoreCardProps {
  name:         string
  type:         StoreType
  quartier?:    string
  specialties?: string[]
  phone?:       string
  whatsapp?:    string
  rating?:      number
  isVerified?:  boolean
  isPartner?:   boolean
  distance_m?:  number | null
  onItinerary?: () => void
  className?:   string
}

export function GroceryStoreCard({
  name,
  type,
  quartier,
  specialties = [],
  phone,
  whatsapp,
  rating,
  isVerified = false,
  isPartner = false,
  distance_m,
  onItinerary,
  className,
}: GroceryStoreCardProps) {
  function formatDistance(m: number): string {
    return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 p-4 rounded-2xl',
        'bg-[var(--bg-surface)] border border-[var(--border)]',
        'transition-all duration-150',
        isPartner && 'border-[var(--border-brand)] shadow-[0_0_0_1px_var(--border-brand)]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="text-2xl shrink-0" aria-hidden>{storeTypeEmoji[type]}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">{name}</h3>
              {isVerified && (
                <CheckCircleIcon size={14} className="text-[var(--info)] shrink-0" aria-label="Vérifié" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <Badge variant="default" size="sm">{storeTypeLabels[type]}</Badge>
              {isPartner && <Badge variant="premium" size="sm">Partenaire</Badge>}
            </div>
          </div>
        </div>

        {/* Rating */}
        {rating && (
          <div className="flex items-center gap-1 shrink-0">
            <StarIcon size={12} className="text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              {rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Location + distance */}
      {(quartier || distance_m !== null) && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <MapPinIcon size={12} />
          <span>{quartier}</span>
          {distance_m !== null && distance_m !== undefined && (
            <span className="text-[var(--brand)] font-medium ml-auto">
              {formatDistance(distance_m)}
            </span>
          )}
        </div>
      )}

      {/* Specialties */}
      {specialties.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {specialties.slice(0, 4).map((s) => (
            <span
              key={s}
              className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)]"
            >
              {s}
            </span>
          ))}
          {specialties.length > 4 && (
            <span className="text-xs text-[var(--text-muted)]">+{specialties.length - 4}</span>
          )}
        </div>
      )}

      {/* Actions */}
      {(phone || whatsapp || onItinerary) && (
        <div className="flex gap-2 pt-1">
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Contacter ${name} sur WhatsApp`}
              className={cn(
                'flex items-center gap-1.5 flex-1 justify-center h-8 rounded-xl text-xs font-medium',
                'bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/25',
                'hover:bg-[#25D366]/25 transition-colors duration-100'
              )}
            >
              <WhatsappIcon size={14} /> WhatsApp
            </a>
          )}
          {phone && !whatsapp && (
            <a
              href={`tel:${phone}`}
              aria-label={`Appeler ${name}`}
              className={cn(
                'flex items-center gap-1.5 flex-1 justify-center h-8 rounded-xl text-xs font-medium',
                'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)]',
                'hover:bg-[var(--bg-overlay)] transition-colors duration-100'
              )}
            >
              <PhoneIcon size={14} /> Appeler
            </a>
          )}
          {onItinerary && (
            <button
              type="button"
              onClick={onItinerary}
              aria-label={`Itinéraire vers ${name}`}
              className={cn(
                'flex items-center gap-1.5 flex-1 justify-center h-8 rounded-xl text-xs font-medium',
                'bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--border-brand)]',
                'hover:bg-[var(--brand)] hover:text-white transition-colors duration-100'
              )}
            >
              <NavigationIcon size={14} /> Itinéraire
            </button>
          )}
        </div>
      )}
    </div>
  )
}
