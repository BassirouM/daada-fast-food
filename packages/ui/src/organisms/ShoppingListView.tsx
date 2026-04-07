'use client'

import * as React from 'react'
import { cn } from '../utils'
import { CheckIcon, MapPinIcon, WhatsappIcon, ExternalLinkIcon } from '../icons'

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA'
}

export interface ShoppingListItem {
  name:          string
  quantity?:     number
  unit?:         string
  estimatedPrice?: number
  stores?:       string[]
  checked?:      boolean
  category?:     string
}

export interface ShoppingListByStore {
  storeName:  string
  storeId?:   string
  whatsapp?:  string
  items:      ShoppingListItem[]
  subtotal?:  number
}

export interface ShoppingListViewProps {
  items?:                ShoppingListItem[]
  totalEstimated?:       number
  groupedByStore?:       ShoppingListByStore[]
  onToggleItem?:         (name: string) => void
  onShareWhatsapp?:      (storeId: string) => void
  className?:            string
}

export function ShoppingListView({
  items = [],
  totalEstimated,
  groupedByStore,
  onToggleItem,
  onShareWhatsapp,
  className,
}: ShoppingListViewProps) {
  const [checkedItems, setCheckedItems] = React.useState<Set<string>>(new Set())
  const [activeTab, setActiveTab]       = React.useState<'list' | 'store'>('list')

  function toggleItem(name: string) {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
    onToggleItem?.(name)
  }

  const checkedCount = checkedItems.size
  const totalItems   = items.length

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Liste de courses</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {checkedCount}/{totalItems} articles cochés
          </p>
        </div>
        {totalEstimated !== undefined && (
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)]">Estimation</p>
            <p className="text-base font-bold text-[var(--brand)]">{formatFCFA(totalEstimated)}</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {totalItems > 0 && (
        <div className="h-1.5 w-full rounded-full bg-[var(--bg-overlay)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--success)] transition-[width] duration-500"
            style={{ width: `${(checkedCount / totalItems) * 100}%` }}
            role="progressbar"
            aria-valuenow={checkedCount}
            aria-valuemax={totalItems}
            aria-label="Progression de la liste"
          />
        </div>
      )}

      {/* Tab toggle */}
      {groupedByStore && groupedByStore.length > 0 && (
        <div className="flex rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-input)] p-0.5 gap-0.5">
          {(['list', 'store'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
              className={cn(
                'flex-1 h-8 rounded-lg text-xs font-medium transition-all duration-150',
                activeTab === tab
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              {tab === 'list' ? 'Par article' : 'Par magasin'}
            </button>
          ))}
        </div>
      )}

      {/* List view */}
      {(activeTab === 'list' || !groupedByStore) && (
        <div className="flex flex-col gap-1" role="list" aria-label="Articles à acheter">
          {items.map((item) => {
            const isChecked = checkedItems.has(item.name)
            return (
              <div
                key={item.name}
                role="listitem"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                  'bg-[var(--bg-surface)] border border-[var(--border)]',
                  'transition-opacity duration-200',
                  isChecked && 'opacity-50'
                )}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isChecked}
                  aria-label={`${isChecked ? 'Décocher' : 'Cocher'} ${item.name}`}
                  onClick={() => toggleItem(item.name)}
                  className={cn(
                    'shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center',
                    'transition-all duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]',
                    isChecked
                      ? 'bg-[var(--success)] border-[var(--success)]'
                      : 'border-[var(--border-strong)] hover:border-[var(--success)]'
                  )}
                >
                  {isChecked && <CheckIcon size={11} className="text-white" />}
                </button>

                {/* Name + quantity */}
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      'text-sm text-[var(--text-primary)]',
                      isChecked && 'line-through text-[var(--text-muted)]'
                    )}
                  >
                    {item.quantity && item.unit && (
                      <span className="font-semibold text-[var(--brand)] mr-1.5">
                        {item.quantity} {item.unit}
                      </span>
                    )}
                    {item.name}
                  </span>
                  {item.stores && item.stores.length > 0 && (
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                      <MapPinIcon size={9} className="inline mr-0.5" />
                      {item.stores.join(', ')}
                    </p>
                  )}
                </div>

                {/* Price */}
                {item.estimatedPrice !== undefined && (
                  <span className="shrink-0 text-xs font-medium text-[var(--text-muted)]">
                    ~{formatFCFA(item.estimatedPrice)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* By-store view */}
      {activeTab === 'store' && groupedByStore && (
        <div className="flex flex-col gap-4">
          {groupedByStore.map((store) => (
            <div
              key={store.storeName}
              className="flex flex-col gap-2 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)]"
            >
              {/* Store header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPinIcon size={14} className="text-[var(--brand)] shrink-0" />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{store.storeName}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {store.subtotal !== undefined && (
                    <span className="text-xs font-semibold text-[var(--success)]">
                      ~{formatFCFA(store.subtotal)}
                    </span>
                  )}
                  {store.whatsapp && (
                    <a
                      href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Commander sur WhatsApp chez ${store.storeName}`}
                      className={cn(
                        'flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] font-medium',
                        'bg-[#25D366]/15 text-[#25D366]',
                        'hover:bg-[#25D366]/25 transition-colors duration-100'
                      )}
                    >
                      <WhatsappIcon size={11} /> Commander
                    </a>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="flex flex-col gap-1">
                {store.items.map((item) => {
                  const isChecked = checkedItems.has(item.name)
                  return (
                    <div key={item.name} className="flex items-center gap-2 py-1">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={isChecked}
                        onClick={() => toggleItem(item.name)}
                        className={cn(
                          'shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center',
                          'transition-all duration-150',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]',
                          isChecked ? 'bg-[var(--success)] border-[var(--success)]' : 'border-[var(--border-strong)]'
                        )}
                        aria-label={`${isChecked ? 'Décocher' : 'Cocher'} ${item.name}`}
                      >
                        {isChecked && <CheckIcon size={9} className="text-white" />}
                      </button>
                      <span className={cn('text-sm flex-1', isChecked && 'line-through text-[var(--text-muted)]')}>
                        {item.quantity && item.unit && (
                          <span className="font-medium text-[var(--brand)] mr-1">{item.quantity} {item.unit}</span>
                        )}
                        {item.name}
                      </span>
                      {item.estimatedPrice !== undefined && (
                        <span className="text-xs text-[var(--text-muted)] shrink-0">
                          {formatFCFA(item.estimatedPrice)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !groupedByStore?.length && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="text-5xl" aria-hidden>🛒</span>
          <p className="text-sm text-[var(--text-muted)]">
            Aucun article. Ajoutez des recettes à votre plan de repas.
          </p>
        </div>
      )}
    </div>
  )
}
