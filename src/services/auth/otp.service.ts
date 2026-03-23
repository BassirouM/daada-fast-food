import { supabase } from '@/lib/supabase'
import { formatPhoneCM } from '@/lib/utils'

export const otpService = {
  async sendOtp(phone: string): Promise<{ error: string | null }> {
    const formattedPhone = formatPhoneCM(phone)

    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    })

    if (error) return { error: error.message }
    return { error: null }
  },

  async verifyOtp(phone: string, token: string): Promise<{ error: string | null }> {
    const formattedPhone = formatPhoneCM(phone)

    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token,
      type: 'sms',
    })

    if (error) return { error: error.message }
    return { error: null }
  },
}
