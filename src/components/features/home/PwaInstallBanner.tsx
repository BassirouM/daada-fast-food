'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY = 'daada-pwa-dismissed'

export default function PwaInstallBanner() {
  const [show, setShow] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Already installed or dismissed
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true ||
      localStorage.getItem(STORAGE_KEY)
    ) {
      return
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIos(ios)

    if (ios) {
      setShow(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setShow(false)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShow(false)
    }
    setDeferredPrompt(null)
  }

  if (!show) return null

  return (
    <div
      className="animate-slide-up"
      style={{
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom) + 5rem)',
        left: '1rem',
        right: '1rem',
        zIndex: 50,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-brand)',
        borderRadius: 'var(--radius-xl)',
        padding: '1rem',
        boxShadow: 'var(--shadow-brand)',
        maxWidth: 480,
        marginInline: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <span style={{ fontSize: '2rem', flexShrink: 0 }}>📱</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
            Installer l&apos;app Daada 📱
          </p>

          {isIos ? (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.5 }}>
              Dans Safari : appuyez sur{' '}
              <strong style={{ color: 'var(--brand)' }}>Partager</strong>{' '}
              puis{' '}
              <strong style={{ color: 'var(--brand)' }}>Sur l&apos;écran d&apos;accueil</strong>
            </p>
          ) : (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Accès rapide, mode hors-ligne, notifications
            </p>
          )}
        </div>

        <button
          onClick={handleDismiss}
          aria-label="Fermer"
          style={{
            flexShrink: 0,
            width: '1.75rem',
            height: '1.75rem',
            borderRadius: '50%',
            background: 'var(--bg-overlay)',
            color: 'var(--text-muted)',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
          }}
        >
          ×
        </button>
      </div>

      {!isIos && deferredPrompt && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button
            onClick={handleDismiss}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-overlay)',
              color: 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              border: '1px solid var(--border)',
            }}
          >
            Plus tard
          </button>
          <button
            onClick={handleInstall}
            style={{
              flex: 2,
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              color: 'white',
              fontSize: '0.8125rem',
              fontWeight: 700,
              border: 'none',
            }}
          >
            Installer maintenant
          </button>
        </div>
      )}
    </div>
  )
}
