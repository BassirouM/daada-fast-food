import type { Coordinates } from './index'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'cancelled'

export type OrderItem = {
  id: string
  menu_item_id: string
  menu_item_name: string
  quantity: number
  unit_price: number
  total_price: number
  selected_options: Array<{
    group_name: string
    option_name: string
    price_modifier: number
  }>
  special_instructions?: string
}

export type OrderTimeline = {
  status: OrderStatus
  timestamp: string
  note?: string
}

export type Order = {
  id: string
  order_number: string
  customer_id: string
  items: OrderItem[]
  status: OrderStatus
  timeline: OrderTimeline[]
  subtotal: number
  delivery_fee: number
  discount: number
  total: number
  delivery_address_id: string
  delivery_coordinates: Coordinates
  delivery_agent_id?: string
  estimated_delivery_time?: string
  special_instructions?: string
  payment_id?: string
  created_at: string
  updated_at: string
}
