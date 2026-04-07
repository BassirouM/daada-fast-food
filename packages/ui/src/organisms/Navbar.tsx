'use client'

import * as React from 'react'
import { cn } from '../utils'
import { CartIcon, MenuIcon, UserIcon, BellIcon } from '../icons'

export interface NavLink {
  label:    string
  href:     string
  active?:  boolean
}

export interface NavbarProps {
  logo?:         React.ReactNode
  links?:        NavLink[]
  cartCount?:    number
  user?:         { name: string; avatar?: string } | null
  onCartOpen?:   () => void
  onLogin?:      () => void
  onLogout?:     () => void
  onMenuOpen?:   () => void
  transparent?:  boolean
  className?:    string
}

export function Navbar({
  logo,
  links = [],
  cartCount = 0,
  user,
  onCartOpen,
  onLogin,
  onLogout,
  onMenuOpen,
  transparent = false,
  className,
}: NavbarProps) {
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    if (!transparent) return
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [transparent])

  const isGlass = transparent && !scrolled

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-[200]',
        'flex items-center justify-between px-4 h-14',
        'transition-all duration-300',
        isGlass
          ? 'bg-transparent'
          : 'bg-[var(--bg-base)] border-b border-[var(--border)] shadow-[var(--shadow-sm)]',
        className
      )}
    >
      {/* Left: menu + logo */}
      <div className="flex items-center gap-3">
        {onMenuOpen && (
          <button
            type="button"
            onClick={onMenuOpen}
            aria-label="Ouvrir le menu"
            className={cn(
              'w-9 h-9 flex items-center justify-center rounded-xl',
              'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              'hover:bg-[var(--bg-elevated)]',
              'transition-colors duration-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]',
              'lg:hidden'
            )}
          >
            <MenuIcon size={20} />
          </button>
        )}
        {logo && (
          <div className="flex items-center" aria-label="Daada Fast Food — Accueil">
            {logo}
          </div>
        )}
      </div>

      {/* Center: desktop nav links */}
      {links.length > 0 && (
        <nav aria-label="Navigation principale" className="hidden lg:flex items-center gap-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium',
                'transition-colors duration-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]',
                link.active
                  ? 'text-[var(--brand)] bg-[var(--brand-subtle)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              )}
              aria-current={link.active ? 'page' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Cart */}
        {onCartOpen && (
          <button
            type="button"
            onClick={onCartOpen}
            aria-label={`Panier — ${cartCount} article${cartCount > 1 ? 's' : ''}`}
            className={cn(
              'relative w-9 h-9 flex items-center justify-center rounded-xl',
              'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              'hover:bg-[var(--bg-elevated)]',
              'transition-colors duration-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]'
            )}
          >
            <CartIcon size={20} />
            {cartCount > 0 && (
              <span
                aria-hidden
                className={cn(
                  'absolute -top-0.5 -right-0.5',
                  'min-w-[18px] h-[18px] px-1 rounded-full',
                  'bg-[var(--brand)] text-white text-[10px] font-bold',
                  'flex items-center justify-center leading-none'
                )}
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        )}

        {/* User */}
        {user ? (
          <button
            type="button"
            onClick={onLogout}
            aria-label={`Déconnexion — ${user.name}`}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl',
              'text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              'hover:bg-[var(--bg-elevated)]',
              'transition-colors duration-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]'
            )}
          >
            <UserIcon size={16} />
            <span className="hidden sm:block max-w-[100px] truncate">{user.name}</span>
          </button>
        ) : (
          onLogin && (
            <button
              type="button"
              onClick={onLogin}
              className={cn(
                'h-9 px-4 rounded-xl text-sm font-semibold',
                'bg-[var(--brand)] text-white',
                'hover:bg-[var(--brand-light)]',
                'transition-colors duration-[120ms]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]'
              )}
            >
              Connexion
            </button>
          )
        )}
      </div>
    </header>
  )
}
