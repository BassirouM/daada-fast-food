import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, title, body: messageBody, data } = body

    if (!user_id || !title || !messageBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get user's FCM token
    const { data: userToken } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', user_id)
      .single()

    if (!userToken?.token) {
      // No token registered, skip push (user will see in-app notification)
      return NextResponse.json({ sent: false, reason: 'No push token' })
    }

    // TODO: Send via Firebase Admin SDK
    // const message = {
    //   token: userToken.token,
    //   notification: { title, body: messageBody },
    //   data,
    // }
    // await admin.messaging().send(message)

    return NextResponse.json({ sent: true })
  } catch {
    return NextResponse.json({ error: 'Push notification failed' }, { status: 500 })
  }
}
