'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, ShoppingCart, Search, X, Sun, Moon } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useCartStore } from '@/stores/cart.store'
import { useUIStore } from '@/stores/ui.store'
import { useTheme } from '@/components/providers/ThemeProvider'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'

// ─── Avatar utilisateur ───────────────────────────────────────────────────────

function UserAvatar({ nom, avatarUrl }: { nom?: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={nom ?? 'Profil'}
        className="h-8 w-8 rounded-full object-cover"
      />
    )
  }

  if (nom) {
    const initials = nom
      .trim()
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('')
    return (
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold"
        style={{ background: 'linear-gradient(135deg, #FF6B00, #CC5500)' }}
        aria-hidden="true"
      >
        {initials}
      </span>
    )
  }

  // Invité
  return (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)]"
      style={{ background: 'var(--bg-elevated)' }}
      aria-hidden="true"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </span>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const { userDB, isAuthenticated } = useAuthStore()
  const cartCount  = useCartStore((s) => s.getItemCount())
  const openDrawer = useUIStore((s) => s.openCartDrawer)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-40 transition-all duration-200',
        'h-14 md:h-16',
        'flex items-center px-4 md:px-6 gap-3',
        'bg-[var(--bg-base)]/95 backdrop-blur-xl border-b border-[var(--border)]',
        scrolled && 'shadow-sm'
      )}
    >
      {/* Logo */}
      <Link href="/" className="shrink-0 mr-2">
        <Logo variant="full" size="sm" />
      </Link>

      {/* Search — desktop */}
      <div className="hidden md:flex flex-1 max-w-md mx-auto relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
        <input
          type="search"
          placeholder="Chercher un plat..."
          className="w-full h-9 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition"
        />
      </div>

      {/* Search — mobile inline */}
      {searchOpen && (
        <div className="md:hidden flex flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            ref={searchRef}
            type="search"
            placeholder="Chercher un plat..."
            className="w-full h-9 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] transition"
          />
        </div>
      )}

      {/* Spacer mobile */}
      {!searchOpen && <div className="flex-1 md:hidden" />}

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Search toggle — mobile */}
        <button
          onClick={() => setSearchOpen((v) => !v)}
          className="md:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition"
          aria-label={searchOpen ? 'Fermer recherche' : 'Ouvrir recherche'}
        >
          {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition"
          aria-label="Changer le thème"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span
            className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--brand)] ring-2 ring-[var(--bg-base)]"
            aria-hidden
          />
        </Link>

        {/* Panier */}
        <button
          id="cart-icon-btn"
          onClick={openDrawer}
          className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition"
          aria-label={`Panier — ${cartCount} article${cartCount !== 1 ? 's' : ''}`}
        >
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-[var(--brand)] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[var(--bg-base)]">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </button>

        {/* Avatar → profil */}
        <Link
          href={isAuthenticated ? '/profile' : '/auth'}
          className="ml-1 shrink-0 ring-2 ring-[var(--border)] hover:ring-[var(--brand)] rounded-full transition"
          aria-label={isAuthenticated ? `Profil de ${userDB?.nom ?? 'utilisateur'}` : 'Se connecter'}
        >
          <UserAvatar {...(userDB?.nom !== undefined && { nom: userDB.nom })} {...(userDB?.avatar_url !== undefined && { avatarUrl: userDB.avatar_url })} />
        </Link>
      </div>
    </header>
  )
}
