'use client'

import { useEffect, useRef, useState } from 'react'

const STATS = [
  { value: 500, suffix: '+', label: 'Plats disponibles', icon: '🍽️' },
  { value: 30, suffix: ' min', label: 'Livraison moyenne', icon: '🛵' },
  { value: 4.9, suffix: '★', label: 'Satisfaction client', icon: '❤️', isDecimal: true },
]

function useCountUp(target: number, isDecimal: boolean, active: boolean) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    const duration = 1200
    const steps = 40
    const increment = target / steps
    let current = 0
    const interval = setInterval(() => {
      current = Math.min(current + increment, target)
      setCount(isDecimal ? Math.round(current * 10) / 10 : Math.floor(current))
      if (current >= target) clearInterval(interval)
    }, duration / steps)
    return () => clearInterval(interval)
  }, [target, isDecimal, active])
  return count
}

function StatItem({ value, suffix, label, icon, isDecimal = false, active }: {
  value: number; suffix: string; label: string; icon: string; isDecimal?: boolean; active: boolean
}) {
  const count = useCountUp(value, !!isDecimal, active)
  return (
    <div
      className="animate-stat-reveal flex flex-col items-center text-center p-4 rounded-2xl"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        flex: 1,
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: '1.75rem' }}>{icon}</span>
      <span
        className="font-display"
        style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand)', lineHeight: 1.2, marginTop: '0.25rem' }}
      >
        {count}{suffix}
      </span>
      <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.3 }}>
        {label}
      </span>
    </div>
  )
}

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) { setActive(true); observer.disconnect() } },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} style={{ padding: '1.5rem 0' }}>
      <div className="container">
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {STATS.map(s => (
            <StatItem key={s.label} {...s} active={active} />
          ))}
        </div>
      </div>
    </section>
  )
}
