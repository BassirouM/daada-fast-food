import { supabase } from '@/lib/supabase'
import type { Payment, PaymentMethod, PaymentStatus } from '@/types/payment'

type InitiatePaymentPayload = {
  order_id: string
  amount: number
  method: PaymentMethod
  phone_number?: string
}

export const paymentService = {
  async initiatePayment(payload: InitiatePaymentPayload): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        ...payload,
        currency: 'XAF',
        status: 'pending',
        initiated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Trigger payment via API route (MTN MoMo or Orange Money)
    const response = await fetch('/api/payment/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_id: data.id, ...payload }),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error ?? 'Payment initiation failed')
    }

    return data as Payment
  },

  async getPaymentById(paymentId: string): Promise<Payment | null> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (error) return null
    return data as Payment
  },

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    providerTransactionId?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .update({
        status,
        provider_transaction_id: providerTransactionId,
        completed_at: ['completed', 'failed'].includes(status) ? new Date().toISOString() : null,
      })
      .eq('id', paymentId)

    if (error) throw new Error(error.message)
  },

  subscribeToPayment(paymentId: string, callback: (payment: Payment) => void) {
    return supabase
      .channel(`payment:${paymentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
          filter: `id=eq.${paymentId}`,
        },
        (payload) => callback(payload.new as Payment)
      )
      .subscribe()
  },
}
