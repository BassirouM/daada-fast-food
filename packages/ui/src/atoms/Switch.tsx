'use client'

import * as React from 'react'
import { cn } from '../utils'

export type SwitchSize = 'sm' | 'md'

export interface SwitchProps {
  checked?:      boolean
  defaultChecked?: boolean
  onChange?:     (checked: boolean) => void
  label?:        string
  description?:  string
  disabled?:     boolean
  size?:         SwitchSize
  id?:           string
  className?:    string
}

const sizeMap: Record<SwitchSize, { track: string; thumb: string; translate: string }> = {
  sm: { track: 'w-8 h-5', thumb: 'w-3.5 h-3.5', translate: 'translate-x-3.5' },
  md: { track: 'w-11 h-6', thumb: 'w-4 h-4', translate: 'translate-x-5' },
}

export function Switch({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  id,
  className,
}: SwitchProps) {
  const generatedId = React.useId()
  const switchId = id ?? generatedId

  const isControlled = controlledChecked !== undefined
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked)
  const isChecked = isControlled ? controlledChecked : internalChecked

  function toggle() {
    if (disabled) return
    const next = !isChecked
    if (!isControlled) setInternalChecked(next)
    onChange?.(next)
  }

  const { track, thumb, translate } = sizeMap[size]

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-label={label}
        aria-describedby={description ? `${switchId}-desc` : undefined}
        disabled={disabled}
        onClick={toggle}
        className={cn(
          'relative inline-flex shrink-0 items-center rounded-full p-0.5',
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2',
          'focus-visible:ring-offset-[var(--bg-base)]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          track,
          isChecked
            ? 'bg-[var(--brand)]'
            : 'bg-[var(--bg-overlay)] border border-[var(--border)]'
        )}
      >
        <span
          aria-hidden
          className={cn(
            'inline-block rounded-full bg-white shadow-sm',
            'transition-transform duration-200',
            thumb,
            isChecked ? translate : 'translate-x-0'
          )}
        />
      </button>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={switchId}
              className="text-sm font-medium text-[var(--text-primary)] cursor-pointer select-none"
              onClick={toggle}
            >
              {label}
            </label>
          )}
          {description && (
            <p
              id={`${switchId}-desc`}
              className="text-xs text-[var(--text-muted)] mt-0.5"
            >
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
