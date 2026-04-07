import * as React from 'react'
import { cn } from '../utils'

export interface IngredientPriceInfo {
  storeName:  string
  pricePerUnit: number
  unit:       string
}

export interface IngredientRowProps {
  name:         string
  quantity?:    number
  unit?:        string
  prices?:      IngredientPriceInfo[]
  isOptional?:  boolean
  substitutes?: string[]
  className?:   string
}

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA'
}

export function IngredientRow({
  name,
  quantity,
  unit,
  prices = [],
  isOptional = false,
  substitutes = [],
  className,
}: IngredientRowProps) {
  const [expanded, setExpanded] = React.useState(false)
  const bestPrice = prices.length > 0 ? prices.reduce((a, b) => a.pricePerUnit < b.pricePerUnit ? a : b) : null

  return (
    <div
      className={cn(
        'flex flex-col gap-1 py-2.5',
        'border-b border-[var(--border)] last:border-b-0',
        className
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-2">
        {/* Bullet */}
        <span
          aria-hidden
          className={cn(
            'shrink-0 w-1.5 h-1.5 rounded-full mt-0.5',
            isOptional ? 'bg-[var(--text-muted)]' : 'bg-[var(--brand)]'
          )}
        />

        {/* Name + quantity */}
        <div className="flex-1 min-w-0">
          <span className="text-sm text-[var(--text-primary)]">
            {quantity && unit ? (
              <>
                <span className="font-semibold text-[var(--brand)] mr-1">
                  {quantity} {unit}
                </span>
              </>
            ) : null}
            {name}
            {isOptional && (
              <span className="ml-1 text-xs text-[var(--text-muted)]">(facultatif)</span>
            )}
          </span>
        </div>

        {/* Best price */}
        {bestPrice && (
          <span className="shrink-0 text-xs font-semibold text-[var(--success)]">
            ~{formatFCFA(bestPrice.pricePerUnit)}/{bestPrice.unit}
          </span>
        )}

        {/* Expand toggle */}
        {(prices.length > 0 || substitutes.length > 0) && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Réduire' : 'Voir les prix et substituts'}
            className="shrink-0 text-xs text-[var(--brand)] underline underline-offset-2 hover:no-underline"
          >
            {expanded ? 'Moins' : 'Plus'}
          </button>
        )}
      </div>

      {/* Expanded: prices by store */}
      {expanded && (
        <div className="ml-4 flex flex-col gap-1.5">
          {prices.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-[var(--text-muted)]">Prix disponibles :</p>
              {prices.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">{p.storeName}</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {formatFCFA(p.pricePerUnit)}/{p.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
          {substitutes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Substituts :</p>
              <p className="text-xs text-[var(--text-secondary)]">{substitutes.join(', ')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
