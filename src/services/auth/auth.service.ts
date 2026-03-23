import { supabase } from '@/lib/supabase'
import type { User, AuthSession, RegisterPayload } from '@/types/auth'

export const authService = {
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !data) return null
    return data as User
  },

  async getSession(): Promise<AuthSession | null> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null

    const user = await authService.getCurrentUser()
    if (!user) return null

    return {
      user,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at ?? 0,
    }
  },

  async register(payload: RegisterPayload): Promise<{ user: User | null; error: string | null }> {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: payload.phone,
    })

    if (error) return { user: null, error: error.message }

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user?.id,
        phone: payload.phone,
        name: payload.name,
        email: payload.email,
        role: 'customer',
        is_verified: true,
      })
      .select()
      .single()

    if (profileError) return { user: null, error: profileError.message }
    return { user: profile as User, error: null }
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut()
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        callback(null)
        return
      }
      const user = await authService.getCurrentUser()
      callback(user)
    })
  },
}
