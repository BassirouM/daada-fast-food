'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/')
    }
  }, [isLoading, isAuthenticated, router])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #F97316 0%, #EA580C 40%, #0A0A0A 100%)',
        gap: '1.5rem',
      }}
    >
      {/* Logo spinner */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          border: '4px solid rgba(255,255,255,0.2)',
          borderTopColor: '#FFFFFF',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9375rem', fontWeight: 500 }}>
        Connexion en cours…
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
