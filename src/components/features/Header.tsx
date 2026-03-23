'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, ShoppingCart, Search, X, Sun, Moon, User } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useCartStore } from '@/stores/cart.store'
import { useTheme } from '@/components/providers/ThemeProvider'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const { user } = useAuthStore()
  const cartCount = useCartStore((s) => s.getItemCount())
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
        scrolled
          ? 'bg-[var(--bg-base)]/80 backdrop-blur-xl border-b border-[var(--border)] shadow-sm'
          : 'bg-transparent'
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

      {/* Spacer */}
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

        {/* Cart */}
        <Link
          href="/cart"
          className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition"
          aria-label={`Panier — ${cartCount} article${cartCount !== 1 ? 's' : ''}`}
        >
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-[var(--brand)] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[var(--bg-base)]">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <Link href="/profile" className="ml-1 shrink-0" aria-label="Profil">
          {user?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-[var(--border)] hover:ring-[var(--brand)] transition"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-elevated)] ring-2 ring-[var(--border)] hover:ring-[var(--brand)] transition text-[var(--text-secondary)]">
              <User className="h-4 w-4" />
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
