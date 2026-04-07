'use client'

import * as React from 'react'
import { cn } from '../utils'
import { PlusIcon, XIcon, CalendarIcon } from '../icons'

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MealPlanEntry {
  recipeId:    string
  recipeTitle: string
  coverImage?: string
}

export interface MealPlanDay {
  date:      string   // ISO yyyy-MM-dd
  breakfast?: MealPlanEntry | null
  lunch?:     MealPlanEntry | null
  dinner?:    MealPlanEntry | null
  snack?:     MealPlanEntry | null
}

export interface MealPlanGridProps {
  weekStart:     string   // ISO yyyy-MM-dd Monday
  plan?:         Record<string, Partial<Record<MealSlot, MealPlanEntry | null>>>
  recipes?:      { id: string; title: string; coverImage?: string }[]
  onAddRecipe?:  (date: string, slot: MealSlot) => void
  onRemoveRecipe?: (date: string, slot: MealSlot) => void
  className?:    string
}

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const SLOTS: { key: MealSlot; label: string; emoji: string }[] = [
  { key: 'breakfast', label: 'Petit-déj', emoji: '☕' },
  { key: 'lunch',     label: 'Déjeuner',  emoji: '🍽️' },
  { key: 'dinner',    label: 'Dîner',     emoji: '🌙' },
  { key: 'snack',     label: 'Encas',     emoji: '🥤' },
]

function addDays(isoDate: string, n: number): string {
  const d = new Date(isoDate)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function formatDay(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export function MealPlanGrid({
  weekStart,
  plan = {},
  onAddRecipe,
  onRemoveRecipe,
  className,
}: MealPlanGridProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Week header */}
      <div className="flex items-center gap-2">
        <CalendarIcon size={16} className="text-[var(--brand)]" />
        <h2 className="text-sm font-bold text-[var(--text-primary)]">
          Semaine du {formatDay(weekStart)}
        </h2>
      </div>

      {/* Slot rows × day columns */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full min-w-[600px] border-collapse" role="grid" aria-label="Plan de repas hebdomadaire">
          {/* Days header */}
          <thead>
            <tr>
              <th className="w-20 pb-2 text-xs font-medium text-[var(--text-muted)] text-left px-1">Repas</th>
              {days.map((day, i) => (
                <th
                  key={day}
                  scope="col"
                  className="pb-2 text-center"
                  aria-label={`${DAYS_FR[i]} ${formatDay(day)}`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{DAYS_FR[i]}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{formatDay(day)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {SLOTS.map((slot) => (
              <tr key={slot.key} className="border-t border-[var(--border)]">
                {/* Slot label */}
                <th
                  scope="row"
                  className="py-2 px-1 text-xs text-[var(--text-muted)] font-medium text-left"
                >
                  <span className="flex items-center gap-1">
                    <span aria-hidden>{slot.emoji}</span>
                    <span className="hidden sm:inline">{slot.label}</span>
                  </span>
                </th>

                {/* Day cells */}
                {days.map((day) => {
                  const entry = plan[day]?.[slot.key]
                  return (
                    <td key={day} className="p-1">
                      {entry ? (
                        <div
                          className="relative group rounded-xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border)] aspect-square"
                          aria-label={`${slot.label} du ${formatDay(day)} : ${entry.recipeTitle}`}
                        >
                          {entry.coverImage ? (
                            <img
                              src={entry.coverImage}
                              alt={entry.recipeTitle}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl bg-[var(--bg-elevated)]">
                              {slot.emoji}
                            </div>
                          )}
                          {/* Remove overlay */}
                          <button
                            type="button"
                            onClick={() => onRemoveRecipe?.(day, slot.key)}
                            aria-label={`Retirer ${entry.recipeTitle}`}
                            className={cn(
                              'absolute inset-0 flex items-center justify-center',
                              'bg-black/60 opacity-0 group-hover:opacity-100',
                              'transition-opacity duration-150',
                              'focus-visible:opacity-100',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand)]'
                            )}
                          >
                            <XIcon size={16} className="text-white" />
                          </button>
                          {/* Title tooltip */}
                          <p className="sr-only">{entry.recipeTitle}</p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAddRecipe?.(day, slot.key)}
                          aria-label={`Ajouter un ${slot.label} pour le ${formatDay(day)}`}
                          className={cn(
                            'w-full aspect-square rounded-xl',
                            'border border-dashed border-[var(--border)]',
                            'flex items-center justify-center',
                            'text-[var(--text-muted)] hover:text-[var(--brand)]',
                            'hover:border-[var(--brand)] hover:bg-[var(--brand-subtle)]',
                            'transition-all duration-150',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]'
                          )}
                        >
                          <PlusIcon size={14} />
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
