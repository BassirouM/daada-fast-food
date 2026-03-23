import type { Coordinates } from './index'

export type DeliveryAddress = {
  id: string
  user_id: string
  label: string
  address_line: string
  quartier: string
  ville: string
  coordinates: Coordinates
  is_default: boolean
  notes?: string
}

export type DeliveryZone = {
  id: string
  name: string
  quartiers: string[]
  delivery_fee: number
  min_delivery_time_minutes: number
  max_delivery_time_minutes: number
  is_active: boolean
}

export type DeliveryAgentStatus = 'available' | 'busy' | 'offline'

export type DeliveryAgent = {
  id: string
  user_id: string
  name: string
  phone: string
  status: DeliveryAgentStatus
  current_coordinates?: Coordinates
  vehicle_type: 'motorcycle' | 'bicycle' | 'car'
  active_order_id?: string
}
