'use client'

import { useAuth } from '@/hooks/useAuth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuth() // initialises Supabase session and subscribes to auth changes
  return <>{children}</>
}
