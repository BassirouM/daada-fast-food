'use client'

import * as React from 'react'
import { cn } from '../utils'
import { ChevronDownIcon, SearchIcon, CheckIcon } from '../icons'

export interface SelectOption {
  value:     string
  label:     string
  disabled?: boolean
}

export interface SelectProps {
  options:      SelectOption[]
  value?:       string
  onChange?:    (value: string) => void
  placeholder?: string
  label?:       string
  error?:       string
  hint?:        string
  disabled?:    boolean
  searchable?:  boolean
  className?:   string
  id?:          string
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner…',
  label,
  error,
  hint,
  disabled = false,
  searchable = false,
  className,
  id,
}: SelectProps) {
  const generatedId = React.useId()
  const selectId = id ?? generatedId
  const listboxId = `${selectId}-listbox`

  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)
  const hasError = Boolean(error)

  const filtered = searchable
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  // Close on outside click
  React.useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setOpen(false); setSearch('') }
    if (e.key === 'Enter' || e.key === ' ') { if (!open) setOpen(true) }
  }

  function select(option: SelectOption) {
    if (option.disabled) return
    onChange?.(option.value)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label id={`${selectId}-label`} className="text-sm font-medium text-[var(--text-primary)] select-none">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        id={selectId}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-labelledby={label ? `${selectId}-label ${selectId}` : undefined}
        aria-invalid={hasError || undefined}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex items-center justify-between w-full h-11 px-4 rounded-xl',
          'bg-[var(--bg-input)] text-sm',
          'border',
          'transition-[border-color,box-shadow] duration-[120ms]',
          'focus:outline-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          selected ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]',
          !hasError && [
            'border-[var(--border)]',
            'focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-glow)]',
          ],
          hasError && 'border-[var(--danger)]',
          open && 'border-[var(--brand)] shadow-[0_0_0_3px_var(--brand-glow)]'
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDownIcon
          size={16}
          className={cn(
            'shrink-0 text-[var(--text-muted)] transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={label ?? placeholder}
          className={cn(
            'absolute z-[var(--z-dropdown,100)] mt-1 w-full',
            'bg-[var(--bg-elevated)] border border-[var(--border)]',
            'rounded-xl shadow-[var(--shadow-lg)]',
            'overflow-hidden animate-scale-in',
            'max-h-60 overflow-y-auto'
          )}
          style={{ top: '100%', left: 0 }}
        >
          {/* Search box */}
          {searchable && (
            <div className="p-2 border-b border-[var(--border)]">
              <div className="relative flex items-center">
                <SearchIcon size={14} className="absolute left-2.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className={cn(
                    'w-full h-8 pl-8 pr-3 rounded-lg text-xs',
                    'bg-[var(--bg-input)] text-[var(--text-primary)]',
                    'border border-[var(--border)]',
                    'placeholder:text-[var(--text-muted)]',
                    'focus:outline-none focus:border-[var(--brand)]'
                  )}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Options */}
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--text-muted)]">Aucun résultat</p>
          ) : (
            filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                disabled={option.disabled}
                onClick={() => select(option)}
                className={cn(
                  'flex items-center justify-between w-full px-4 py-2.5 text-sm text-left',
                  'transition-colors duration-100',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  option.value === value
                    ? 'bg-[var(--brand-subtle)] text-[var(--brand)]'
                    : 'text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]'
                )}
              >
                {option.label}
                {option.value === value && <CheckIcon size={14} />}
              </button>
            ))
          )}
        </div>
      )}

      {/* Messages */}
      {error && (
        <p className="text-xs text-[var(--danger)]" role="alert">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-[var(--text-muted)]">{hint}</p>
      )}
    </div>
  )
}
