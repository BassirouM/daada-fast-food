import { supabase } from '@/lib/supabase'
import { generateOrderNumber } from '@/lib/utils'
import type { Order, OrderItem, OrderStatus } from '@/types/orders'

type CreateOrderPayload = {
  customer_id: string
  items: OrderItem[]
  delivery_address_id: string
  delivery_coordinates: { lat: number; lng: number }
  special_instructions?: string
  subtotal: number
  delivery_fee: number
  discount: number
  total: number
}

export const ordersService = {
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const orderNumber = generateOrderNumber()

    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...payload,
        order_number: orderNumber,
        status: 'pending',
        timeline: [{ status: 'pending', timestamp: new Date().toISOString() }],
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as Order
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error) return null
    return data as Order
  },

  async getCustomerOrders(customerId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data as Order[]
  },

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    note?: string
  ): Promise<void> {
    const { data: current, error: fetchError } = await supabase
      .from('orders')
      .select('timeline')
      .eq('id', orderId)
      .single()

    if (fetchError) throw new Error(fetchError.message)

    const timeline = [
      ...(current.timeline as Order['timeline']),
      { status, timestamp: new Date().toISOString(), note },
    ]

    const { error } = await supabase
      .from('orders')
      .update({ status, timeline, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (error) throw new Error(error.message)
  },

  subscribeToOrder(orderId: string, callback: (order: Order) => void) {
    return supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => callback(payload.new as Order)
      )
      .subscribe()
  },
}
