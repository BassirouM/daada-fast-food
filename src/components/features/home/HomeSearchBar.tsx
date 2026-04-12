'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export default function HomeSearchBar() {
  const [query, setQuery] = useState('')
  const router  = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/menu?q=${encodeURIComponent(q)}`)
    else    router.push('/menu')
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 480 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
          overflow: 'hidden',
          border: '2px solid transparent',
          transition: 'border-color 0.2s',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        <Search
          style={{ width: 20, height: 20, color: '#9CA3AF', marginLeft: 14, flexShrink: 0 }}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Burgers, poulet, pizza…"
          aria-label="Rechercher un plat"
          style={{
            flex: 1,
            padding: '14px 12px',
            fontSize: '0.9375rem',
            color: '#111827',
            background: 'transparent',
            border: 'none',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            margin: 5,
            padding: '9px 18px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #F97316, #EA580C)',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Chercher
        </button>
      </div>
    </form>
  )
}
