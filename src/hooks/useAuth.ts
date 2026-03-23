'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth'

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    setLoading(true)

    // Initialize user from session
    authService.getCurrentUser().then((user) => {
      setUser(user)
    })

    // Subscribe to auth changes
    const { data: { subscription } } = authService.onAuthStateChange(setUser)

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setLoading])

  return { user, isLoading, isAuthenticated }
}
