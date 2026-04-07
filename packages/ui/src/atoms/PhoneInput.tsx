'use client'

import * as React from 'react'
import { cn } from '../utils'
import { CheckCircleIcon, AlertCircleIcon } from '../icons'

/** Camerounais phone number validation (MTN/Orange/other) */
function validateCamerounPhone(value: string): boolean {
  const cleaned = value.replace(/\s/g, '')
  // Accept 9 digits (without +237 prefix) or full +237 format
  return /^(6[5-9]\d{7}|2[23]\d{7})$/.test(cleaned)
}

export interface PhoneInputProps {
  value?:       string
  onChange?:    (value: string) => void
  label?:       string
  error?:       string
  hint?:        string
  disabled?:    boolean
  autoFocus?:   boolean
  className?:   string
  id?:          string
}

export function PhoneInput({
  value = '',
  onChange,
  label,
  error,
  hint,
  disabled,
  autoFocus,
  className,
  id,
}: PhoneInputProps) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId

  const [isValid, setIsValid] = React.useState<boolean | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Only allow digits and spaces
    const cleaned = e.target.value.replace(/[^\d\s]/g, '').slice(0, 12)
    onChange?.(cleaned)
    if (cleaned.replace(/\s/g, '').length >= 9) {
      setIsValid(validateCamerounPhone(cleaned))
    } else {
      setIsValid(null)
    }
  }

  const hasError = Boolean(error) || isValid === false
  const hasSuccess = isValid === true && !error

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--text-primary)] select-none"
        >
          {label}
        </label>
      )}

      <div className="flex items-center">
        {/* Fixed +237 prefix */}
        <div
          className={cn(
            'flex items-center gap-1.5 h-11 px-3',
            'bg-[var(--bg-elevated)] text-[var(--text-secondary)]',
            'border border-r-0 border-[var(--border)]',
            'rounded-l-xl text-sm font-medium select-none',
            'shrink-0'
          )}
          aria-label="Indicatif Cameroun"
        >
          <span className="text-base leading-none" role="img" aria-label="drapeau Cameroun">🇨🇲</span>
          <span>+237</span>
        </div>

        {/* Phone number field */}
        <div className="relative flex-1">
          <input
            id={inputId}
            type="tel"
            inputMode="numeric"
            autoFocus={autoFocus}
            disabled={disabled}
            value={value}
            onChange={handleChange}
            placeholder="6XX XXX XXX"
            maxLength={12}
            className={cn(
              'w-full h-11 pr-10 pl-4',
              'bg-[var(--bg-input)] text-[var(--text-primary)]',
              'border text-sm',
              'placeholder:text-[var(--text-muted)]',
              'transition-[border-color,box-shadow] duration-[120ms]',
              'focus:outline-none',
              'rounded-r-xl rounded-l-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              !hasError && !hasSuccess && [
                'border-[var(--border)]',
                'focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-glow)]',
              ],
              hasError && [
                'border-[var(--danger)]',
                'focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]',
              ],
              hasSuccess && [
                'border-[var(--success)]',
                'focus:shadow-[0_0_0_3px_rgba(34,197,94,0.2)]',
              ],
            )}
            aria-invalid={hasError || undefined}
            aria-describedby={
              [error && `${inputId}-error`, hint && `${inputId}-hint`]
                .filter(Boolean)
                .join(' ') || undefined
            }
          />
          {/* Validation indicator */}
          {isValid !== null && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {isValid ? (
                <CheckCircleIcon size={16} className="text-[var(--success)]" />
              ) : (
                <AlertCircleIcon size={16} className="text-[var(--danger)]" />
              )}
            </span>
          )}
        </div>
      </div>

      {error && (
        <p id={`${inputId}-error`} className="text-xs text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
      {isValid === false && !error && (
        <p className="text-xs text-[var(--danger)]" role="alert">
          Numéro invalide. Exemple : 677 123 456
        </p>
      )}
      {hint && !error && isValid !== false && (
        <p id={`${inputId}-hint`} className="text-xs text-[var(--text-muted)]">
          {hint}
        </p>
      )}
    </div>
  )
}
