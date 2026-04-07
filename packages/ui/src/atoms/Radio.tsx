'use client'

import * as React from 'react'
import { cn } from '../utils'

export interface RadioOption {
  value:        string
  label:        string
  description?: string
  disabled?:    boolean
}

export interface RadioGroupProps {
  options:    RadioOption[]
  value?:     string
  onChange?:  (value: string) => void
  name:       string
  disabled?:  boolean
  className?: string
}

export function RadioGroup({
  options,
  value,
  onChange,
  name,
  disabled = false,
  className,
}: RadioGroupProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)} role="radiogroup">
      {options.map((option) => (
        <Radio
          key={option.value}
          name={name}
          value={option.value}
          label={option.label}
          description={option.description}
          checked={value === option.value}
          disabled={disabled || option.disabled}
          onChange={() => onChange?.(option.value)}
        />
      ))}
    </div>
  )
}

export interface RadioProps {
  name:         string
  value:        string
  label?:       string
  description?: string
  checked?:     boolean
  disabled?:    boolean
  onChange?:    () => void
  id?:          string
  className?:   string
}

export function Radio({
  name,
  value,
  label,
  description,
  checked = false,
  disabled = false,
  onChange,
  id,
  className,
}: RadioProps) {
  const generatedId = React.useId()
  const radioId = id ?? generatedId

  return (
    <label
      htmlFor={radioId}
      className={cn(
        'flex items-start gap-3 cursor-pointer rounded-xl p-3',
        'border transition-colors duration-150',
        'select-none',
        checked
          ? 'border-[var(--brand)] bg-[var(--brand-subtle)]'
          : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-transparent',
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
    >
      <div className="relative flex items-center justify-center mt-0.5 shrink-0">
        <input
          id={radioId}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="sr-only peer"
        />
        <span
          aria-hidden
          className={cn(
            'w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center',
            'transition-all duration-150',
            checked
              ? 'border-[var(--brand)]'
              : 'border-[var(--border-strong)]'
          )}
        >
          {checked && (
            <span className="w-2 h-2 rounded-full bg-[var(--brand)]" />
          )}
        </span>
      </div>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-[var(--text-muted)] mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  )
}
