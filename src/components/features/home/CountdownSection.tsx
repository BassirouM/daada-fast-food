'use client'

import { useEffect, useState } from 'react'

function getSecondsUntil20h(): number {
  const now = new Date()
  const target = new Date(now)
  target.setHours(20, 0, 0, 0)
  if (now >= target) target.setDate(target.getDate() + 1)
  return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000))
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function CountdownSection() {
  const [seconds, setSeconds] = useState(getSecondsUntil20h)

  useEffect(() => {
    const id = setInterval(() => setSeconds(getSecondsUntil20h()), 1000)
    return () => clearInterval(id)
  }, [])

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: 'var(--brand)',
      }}
    >
      <span>⏱</span>
      <span
        style={{
          fontVariantNumeric: 'tabular-nums',
          background: 'rgba(255,107,0,0.12)',
          padding: '0.125rem 0.5rem',
          borderRadius: 'var(--radius-sm)',
          letterSpacing: '0.05em',
        }}
      >
        {pad(h)}:{pad(m)}:{pad(s)}
      </span>
    </div>
  )
}
