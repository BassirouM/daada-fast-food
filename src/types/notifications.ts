export type NotificationType =
  | 'order_confirmed'
  | 'order_preparing'
  | 'order_ready'
  | 'order_picked_up'
  | 'order_delivered'
  | 'order_cancelled'
  | 'payment_success'
  | 'payment_failed'
  | 'promotion'
  | 'system'

export type Notification = {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  data?: Record<string, string>
  is_read: boolean
  created_at: string
}
