import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/auth'
import type { UserDB, RoleUser } from '@/types'

type AuthState = {
  // Legacy (rétrocompatibilité avec useAuth.ts existant)
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void

  // Nouveaux champs JWT
  userDB: UserDB | null
  accessToken: string | null
  tokenExpiry: number | null   // Unix timestamp (secondes)
  role: RoleUser | null

  setSession: (params: {
    user: UserDB
    accessToken: string
    expiresAt: number
  }) => void
  setAccessToken: (token: string, expiresAt: number) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // ── Legacy ──
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: user !== null,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      reset: () =>
        set({
          user:            null,
          isAuthenticated: false,
          isLoading:       false,
          userDB:          null,
          accessToken:     null,
          tokenExpiry:     null,
          role:            null,
        }),

      // ── JWT ──
      userDB:      null,
      accessToken: null,
      tokenExpiry: null,
      role:        null,

      setSession: ({ user, accessToken, expiresAt }) =>
        set({
          userDB:          user,
          accessToken,
          tokenExpiry:     expiresAt,
          role:            user.role,
          isAuthenticated: true,
          isLoading:       false,
        }),

      setAccessToken: (token, expiresAt) =>
        set({ accessToken: token, tokenExpiry: expiresAt }),

      clearSession: () =>
        set({
          userDB:          null,
          accessToken:     null,
          tokenExpiry:     null,
          role:            null,
          user:            null,
          isAuthenticated: false,
          isLoading:       false,
        }),
    }),
    {
      name: 'daada-auth',
      partialize: (state) => ({
        user:            state.user,
        userDB:          state.userDB,
        isAuthenticated: state.isAuthenticated,
        role:            state.role,
        // Ne pas persister les tokens (sécurité)
      }),
    }
  )
)
