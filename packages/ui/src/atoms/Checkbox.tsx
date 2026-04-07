'use client'

import * as React from 'react'
import { cn } from '../utils'
import { CheckIcon, MinusIcon } from '../icons'

export interface CheckboxProps {
  checked?:        boolean
  defaultChecked?: boolean
  indeterminate?:  boolean
  onChange?:       (checked: boolean) => void
  label?:          string
  disabled?:       boolean
  id?:             string
  className?:      string
}

export function Checkbox({
  checked: controlledChecked,
  defaultChecked = false,
  indeterminate = false,
  onChange,
  label,
  disabled = false,
  id,
  className,
}: CheckboxProps) {
  const generatedId = React.useId()
  const checkboxId = id ?? generatedId
  const inputRef = React.useRef<HTMLInputElement>(null)

  const isControlled = controlledChecked !== undefined
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked)
  const isChecked = isControlled ? controlledChecked : internalChecked

  // Sync indeterminate state
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!isControlled) setInternalChecked(e.target.checked)
    onChange?.(e.target.checked)
  }

  const isActive = isChecked || indeterminate

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative flex items-center justify-center">
        <input
          ref={inputRef}
          id={checkboxId}
          type="checkbox"
          checked={isChecked}
          disabled={disabled}
          onChange={handleChange}
          aria-checked={indeterminate ? 'mixed' : isChecked}
          className="sr-only peer"
        />
        <label
          htmlFor={checkboxId}
          className={cn(
            'flex items-center justify-center w-5 h-5 rounded-md',
            'border-2 transition-all duration-150 cursor-pointer',
            'focus-within:ring-2 focus-within:ring-[var(--brand)] focus-within:ring-offset-1',
            'disabled:cursor-not-allowed',
            isActive
              ? 'bg-[var(--brand)] border-[var(--brand)]'
              : 'bg-transparent border-[var(--border-strong)] hover:border-[var(--brand)]',
            disabled && 'opacity-40 cursor-not-allowed'
          )}
        >
          {indeterminate ? (
            <MinusIcon size={12} className="text-white" />
          ) : isChecked ? (
            <CheckIcon size={12} className="text-white" />
          ) : null}
        </label>
      </div>

      {label && (
        <label
          htmlFor={checkboxId}
          className={cn(
            'text-sm text-[var(--text-primary)] cursor-pointer select-none',
            disabled && 'opacity-40 cursor-not-allowed'
          )}
        >
          {label}
        </label>
      )}
    </div>
  )
}
