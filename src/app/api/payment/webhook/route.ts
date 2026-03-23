import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createAdminClient()

    // Verify webhook signature (implement per provider)
    const { payment_id, status, provider_transaction_id } = body

    if (!payment_id || !status) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }

    // Update payment status
    await supabase
      .from('payments')
      .update({
        status,
        provider_transaction_id,
        completed_at: ['completed', 'failed'].includes(status) ? new Date().toISOString() : null,
      })
      .eq('id', payment_id)

    // If payment completed, confirm the order
    if (status === 'completed') {
      const { data: payment } = await supabase
        .from('payments')
        .select('order_id')
        .eq('id', payment_id)
        .single()

      if (payment) {
        await supabase
          .from('orders')
          .update({ status: 'confirmed', updated_at: new Date().toISOString() })
          .eq('id', payment.order_id)
      }
    }

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
