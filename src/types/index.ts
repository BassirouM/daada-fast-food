// =============================================================================
// DAADA FAST FOOD - Global Types
// =============================================================================

export type { User, AuthSession, AuthError } from './auth'
export type { MenuItem, MenuCategory, MenuItemOption } from './menu'
export type { Order, OrderItem, OrderStatus, OrderTimeline } from './orders'
export type { Payment, PaymentMethod, PaymentStatus } from './payment'
export type { DeliveryAddress, DeliveryZone, DeliveryAgent } from './delivery'
export type { Notification, NotificationType } from './notifications'

// Common utility types
export type ApiResponse<T> = {
  data: T | null
  error: string | null
  status: number
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export type Coordinates = {
  lat: number
  lng: number
}
