'use client'

import * as React from 'react'
import { cn } from '../utils'

export interface SliderProps {
  min?:          number
  max?:          number
  step?:         number
  value?:        number
  defaultValue?: number
  onChange?:     (value: number) => void
  label?:        string
  valueDisplay?: (value: number) => string
  disabled?:     boolean
  className?:    string
  id?:           string
}

export function Slider({
  min = 0,
  max = 100,
  step = 1,
  value: controlledValue,
  defaultValue,
  onChange,
  label,
  valueDisplay,
  disabled = false,
  className,
  id,
}: SliderProps) {
  const generatedId = React.useId()
  const sliderId = id ?? generatedId

  const isControlled = controlledValue !== undefined
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? min)
  const value = isControlled ? controlledValue : internalValue

  const percent = ((value - min) / (max - min)) * 100

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value)
    if (!isControlled) setInternalValue(v)
    onChange?.(v)
  }

  const displayText = valueDisplay ? valueDisplay(value) : String(value)

  return (
    <div className={cn('flex flex-col gap-2 w-full', className)}>
      {(label || valueDisplay !== undefined) && (
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={sliderId}
              className="text-sm font-medium text-[var(--text-primary)] select-none"
            >
              {label}
            </label>
          )}
          <span
            className="text-sm font-semibold text-[var(--brand)]"
            aria-live="polite"
          >
            {displayText}
          </span>
        </div>
      )}

      <div className="relative flex items-center h-6">
        {/* Track */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-[var(--bg-overlay)]">
          <div
            className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-75"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Native range input (accessible) */}
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={handleChange}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={displayText}
          className={cn(
            'absolute inset-x-0 h-full w-full opacity-0 cursor-pointer',
            'disabled:cursor-not-allowed'
          )}
        />

        {/* Thumb (visual only) */}
        <div
          aria-hidden
          className={cn(
            'absolute w-5 h-5 rounded-full bg-white shadow-md',
            'border-2 border-[var(--brand)]',
            'transition-[left] duration-75 -translate-x-1/2',
            'pointer-events-none',
            disabled && 'opacity-40'
          )}
          style={{ left: `${percent}%` }}
        />
      </div>

      {/* Min/max labels */}
      <div className="flex justify-between text-xs text-[var(--text-muted)]">
        <span>{valueDisplay ? valueDisplay(min) : min}</span>
        <span>{valueDisplay ? valueDisplay(max) : max}</span>
      </div>
    </div>
  )
}
