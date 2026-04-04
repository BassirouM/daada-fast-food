import * as React from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon' | 'wordmark'
  className?: string
}

const sizeMap = {
  sm: { icon: 28, text: 16 },
  md: { icon: 36, text: 20 },
  lg: { icon: 48, text: 28 },
  xl: { icon: 64, text: 36 },
}

/** Daada flame icon — static SVG, no animation */
function FlameIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer flame */}
      <path
        d="M20 38C10.06 38 2 29.94 2 20C2 13 6 7.5 11 4C11 4 10 10 14 12C14 7 18 3 22 2C22 2 19 8 22 12C24 14 26 11 26 11C28 14 28 18 25 21C27 21 29 19 29 19C30 22 29 26 27 28C30 27 33 24 33 24C33 30 27 38 20 38Z"
        fill="url(#flame-gradient)"
      />
      {/* Inner glow */}
      <path
        d="M20 34C13.37 34 8 28.63 8 22C8 18 10 15 13 13C13 13 12.5 17 15 18.5C15 15 17.5 12.5 20 11C20 11 18 15 20 17C21.5 18.5 23 16.5 23 16.5C24 18.5 23.5 21 21.5 23C23 23 24.5 21.5 24.5 21.5C25 23.5 24 26 22 27.5C24 27 25.5 25 25.5 25C25.5 28.5 23 34 20 34Z"
        fill="url(#flame-inner)"
      />
      {/* Center highlight */}
      <ellipse cx="19" cy="26" rx="3" ry="4" fill="white" opacity="0.2" />
      <defs>
        <linearGradient id="flame-gradient" x1="20" y1="2" x2="20" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FF8C38" />
          <stop offset="100%" stopColor="#FF6B00" />
        </linearGradient>
        <linearGradient id="flame-inner" x1="20" y1="11" x2="20" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FFD580" />
          <stop offset="100%" stopColor="#FF8C38" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function Logo({ size = 'md', variant = 'full', className }: LogoProps) {
  const { icon, text } = sizeMap[size]

  if (variant === 'icon') {
    return (
      <span className={cn('inline-flex', className)} aria-label="Daada Fast Food">
        <FlameIcon size={icon} />
      </span>
    )
  }

  if (variant === 'wordmark') {
    return (
      <span
        className={cn('inline-flex items-center font-display font-bold tracking-tight', className)}
        style={{ fontSize: text }}
        aria-label="Daada Fast Food"
      >
        <span style={{ color: 'var(--brand)' }}>Daada</span>
      </span>
    )
  }

  // full — icon + wordmark
  return (
    <span
      className={cn('inline-flex items-center gap-2', className)}
      aria-label="Daada Fast Food"
    >
      <FlameIcon size={icon} />
      <span
        className="font-display font-bold tracking-tight leading-none"
        style={{ fontSize: text }}
      >
        <span style={{ color: 'var(--brand)' }}>Daada</span>
      </span>
    </span>
  )
}

/** Small favicon variant (32×32) */
export function LogoFavicon() {
  return <FlameIcon size={32} />
}
