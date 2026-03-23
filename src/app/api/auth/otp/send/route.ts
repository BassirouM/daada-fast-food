import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { formatPhoneCM, isValidPhoneCM } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    if (!isValidPhoneCM(phone)) {
      return NextResponse.json(
        { error: 'Numéro de téléphone invalide. Utilisez un numéro MTN ou Orange du Cameroun.' },
        { status: 400 }
      )
    }

    const formattedPhone = formatPhoneCM(phone)
    const supabase = createAdminClient()

    // Use signInWithOtp for phone OTP (admin client bypasses rate limits)
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ sent: true, phone: formattedPhone })
  } catch {
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
