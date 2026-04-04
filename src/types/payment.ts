export type PaymentMethod = 'mtn_momo' | 'orange_money' | 'cash_on_delivery'

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'

export type Payment = {
  id: string
  order_id: string
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  currency: 'XAF'
  phone_number?: string
  provider_transaction_id?: string
  provider_reference?: string
  failure_reason?: string
  initiated_at: string
  completed_at?: string
}
