'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import { ordersService } from '@/services/orders'
import { useAuthStore } from '@/stores/auth.store'
import type { Order } from '@/types/orders'

export function useOrders() {
  const user = useAuthStore((s) => s.user)
  return useSWR(
    user ? `orders/${user.id}` : null,
    () => ordersService.getCustomerOrders(user!.id),
    { revalidateOnFocus: true }
  )
}

export function useOrder(orderId: string) {
  const { data, mutate, ...rest } = useSWR(
    orderId ? `order/${orderId}` : null,
    () => ordersService.getOrderById(orderId)
  )

  // Subscribe to real-time updates
  useEffect(() => {
    if (!orderId) return

    const channel = ordersService.subscribeToOrder(orderId, (updatedOrder: Order) => {
      mutate(updatedOrder, false)
    })

    return () => {
      channel.unsubscribe()
    }
  }, [orderId, mutate])

  return { data, mutate, ...rest }
}
