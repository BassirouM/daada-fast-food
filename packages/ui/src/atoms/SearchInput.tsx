'use client'

import * as React from 'react'
import { cn, debounce } from '../utils'
import { SearchIcon, XIcon, LoaderIcon } from '../icons'

export interface SearchInputProps {
  value?:          string
  defaultValue?:   string
  onSearch?:       (value: string) => void
  onChange?:       (value: string) => void
  placeholder?:    string
  debounceMs?:     number
  loading?:        boolean
  disabled?:       boolean
  autoFocus?:      boolean
  className?:      string
  id?:             string
  'aria-label'?:   string
}

export function SearchInput({
  value: controlledValue,
  defaultValue = '',
  onSearch,
  onChange,
  placeholder = 'Rechercher…',
  debounceMs = 300,
  loading = false,
  disabled = false,
  autoFocus = false,
  className,
  id,
  'aria-label': ariaLabel = 'Champ de recherche',
}: SearchInputProps) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId

  const isControlled = controlledValue !== undefined
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const displayValue = isControlled ? controlledValue : internalValue

  // Debounced search callback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = React.useCallback(
    debounce((v: unknown) => onSearch?.(v as string), debounceMs),
    [onSearch, debounceMs]
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    if (!isControlled) setInternalValue(v)
    onChange?.(v)
    debouncedSearch(v)
  }

  function handleClear() {
    if (!isControlled) setInternalValue('')
    onChange?.('')
    onSearch?.('')
  }

  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <span className="absolute left-3 text-[var(--text-muted)] pointer-events-none" aria-hidden>
        {loading
          ? <LoaderIcon size={16} />
          : <SearchIcon size={16} />
        }
      </span>

      <input
        id={inputId}
        type="search"
        role="searchbox"
        autoFocus={autoFocus}
        disabled={disabled}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-busy={loading}
        className={cn(
          'w-full h-11 pl-9 pr-9 rounded-xl',
          'bg-[var(--bg-input)] text-[var(--text-primary)] text-sm',
          'border border-[var(--border)]',
          'placeholder:text-[var(--text-muted)]',
          'transition-[border-color,box-shadow] duration-[120ms]',
          'focus:outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-glow)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Hide native clear button
          '[&::-webkit-search-cancel-button]:appearance-none'
        )}
      />

      {/* Clear button */}
      {displayValue && !loading && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Effacer la recherche"
          className={cn(
            'absolute right-3',
            'flex items-center justify-center',
            'w-5 h-5 rounded-full',
            'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            'bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)]',
            'transition-colors duration-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]'
          )}
        >
          <XIcon size={10} />
        </button>
      )}
    </div>
  )
}
