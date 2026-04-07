'use client'

import * as React from 'react'
import { cn } from '../utils'
import { CheckCircleIcon, MapPinIcon, TagIcon } from '../icons'
import { Button } from '../atoms/Button'
import { Input } from '../atoms/Input'
import { Select } from '../atoms/Select'
import { Spinner } from '../atoms/Spinner'

export interface PriceReportStore {
  id:   string
  name: string
}

export interface PriceReporterFormProps {
  stores?:       PriceReportStore[]
  ingredientName?: string
  onSubmit?:     (report: {
    ingredientName: string
    storeId:        string
    price:          number
    unit:           string
  }) => Promise<void>
  className?: string
}

const UNITS = [
  { value: 'kg',    label: 'Kilogramme (kg)' },
  { value: 'g',     label: 'Gramme (g)' },
  { value: 'L',     label: 'Litre (L)' },
  { value: 'cl',    label: 'Centilitre (cl)' },
  { value: 'pièce', label: 'Pièce' },
  { value: 'tas',   label: 'Tas' },
  { value: 'botte', label: 'Botte' },
  { value: 'sachet', label: 'Sachet' },
]

export function PriceReporterForm({
  stores = [],
  ingredientName: initialIngredient = '',
  onSubmit,
  className,
}: PriceReporterFormProps) {
  const [ingredient, setIngredient] = React.useState(initialIngredient)
  const [storeId,    setStoreId]    = React.useState('')
  const [price,      setPrice]      = React.useState('')
  const [unit,       setUnit]       = React.useState('kg')
  const [loading,    setLoading]    = React.useState(false)
  const [success,    setSuccess]    = React.useState(false)
  const [error,      setError]      = React.useState('')

  const storeOptions = stores.map((s) => ({ value: s.id, label: s.name }))

  const isValid =
    ingredient.trim().length >= 2 &&
    storeId !== '' &&
    parseFloat(price) > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || loading) return

    const numPrice = parseFloat(price)
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Le prix doit être un nombre positif.')
      return
    }

    setError('')
    setLoading(true)
    try {
      await onSubmit?.({
        ingredientName: ingredient.trim(),
        storeId,
        price: numPrice,
        unit,
      })
      setSuccess(true)
      setIngredient(initialIngredient)
      setStoreId('')
      setPrice('')
      setUnit('kg')
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-4', className)}
      aria-label="Signaler un prix"
      noValidate
    >
      {/* Header */}
      <div>
        <h2 className="text-sm font-bold text-[var(--text-primary)]">Signaler un prix</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Aidez la communauté en partageant les prix du marché.
        </p>
      </div>

      {/* Success banner */}
      {success && (
        <div
          role="alert"
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-xl',
            'bg-[var(--success)]/10 border border-[var(--success)]/30',
            'text-[var(--success)] text-sm font-medium'
          )}
        >
          <CheckCircleIcon size={16} className="shrink-0" />
          Prix signalé avec succès. Merci !
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className={cn(
            'px-3 py-2.5 rounded-xl text-sm',
            'bg-[var(--danger)]/10 border border-[var(--danger)]/30',
            'text-[var(--danger)]'
          )}
        >
          {error}
        </div>
      )}

      {/* Ingredient name */}
      <div className="flex flex-col gap-1">
        <label htmlFor="pr-ingredient" className="text-xs font-medium text-[var(--text-secondary)]">
          Ingrédient <span aria-hidden className="text-[var(--danger)]">*</span>
        </label>
        <div className="relative">
          <TagIcon
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
          <input
            id="pr-ingredient"
            type="text"
            value={ingredient}
            onChange={(e) => setIngredient(e.target.value)}
            placeholder="Ex: Tomates, Gombo, Poulet…"
            required
            maxLength={80}
            aria-required="true"
            className={cn(
              'w-full h-10 pl-9 pr-3 rounded-xl text-sm',
              'bg-[var(--bg-input)] text-[var(--text-primary)]',
              'border border-[var(--border)]',
              'placeholder:text-[var(--text-muted)]',
              'focus:outline-none focus:border-[var(--brand)]',
              'transition-colors duration-100'
            )}
          />
        </div>
      </div>

      {/* Store */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Marché / Boutique <span aria-hidden className="text-[var(--danger)]">*</span>
        </label>
        {stores.length > 0 ? (
          <Select
            options={storeOptions}
            value={storeId}
            onChange={setStoreId}
            placeholder="Choisir un magasin…"
            searchable
          />
        ) : (
          <div className="flex items-center gap-2 px-3 h-10 rounded-xl bg-[var(--bg-overlay)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
            <MapPinIcon size={13} />
            Aucun magasin enregistré
          </div>
        )}
      </div>

      {/* Price + unit row */}
      <div className="flex gap-3">
        <div className="flex-1 flex flex-col gap-1">
          <label htmlFor="pr-price" className="text-xs font-medium text-[var(--text-secondary)]">
            Prix (FCFA) <span aria-hidden className="text-[var(--danger)]">*</span>
          </label>
          <input
            id="pr-price"
            type="number"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Ex: 500"
            min={1}
            max={9999999}
            required
            aria-required="true"
            className={cn(
              'w-full h-10 px-3 rounded-xl text-sm',
              'bg-[var(--bg-input)] text-[var(--text-primary)]',
              'border border-[var(--border)]',
              'placeholder:text-[var(--text-muted)]',
              'focus:outline-none focus:border-[var(--brand)]',
              'transition-colors duration-100',
              '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
            )}
          />
        </div>

        <div className="w-36 flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Unité</label>
          <Select
            options={UNITS}
            value={unit}
            onChange={setUnit}
            placeholder="Unité"
          />
        </div>
      </div>

      {/* Helper text */}
      <p className="text-[10px] text-[var(--text-muted)] -mt-2">
        Indiquez le prix pour <strong className="text-[var(--text-secondary)]">1 {unit}</strong> de cet ingrédient.
      </p>

      {/* Submit */}
      <Button
        type="submit"
        fullWidth
        size="lg"
        disabled={!isValid || loading}
        aria-label="Envoyer le signalement de prix"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" label="Envoi en cours…" />
            Envoi…
          </span>
        ) : (
          'Signaler ce prix'
        )}
      </Button>
    </form>
  )
}
