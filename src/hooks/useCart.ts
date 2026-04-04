'use client'

import { useCallback } from 'react'
import { useCartStore } from '@/stores/cart.store'
import type { MenuItem } from '@/types/menu'
import type { CartItem } from '@/stores/cart.store'
import { formatPrice } from '@/lib/utils'

export function useCart() {
  const store = useCartStore()

  const buildCartItemId = useCallback(
    (menuItemId: string, optionIds: string[]): string => {
      return [menuItemId, ...optionIds.sort()].join('__')
    },
    []
  )

  const addToCart = useCallback(
    (
      menuItem: MenuItem,
      quantity: number,
      selectedOptions: CartItem['selectedOptions'] = [],
      specialInstructions?: string
    ) => {
      const optionIds = selectedOptions.map((o) => o.optionId)
      const id = buildCartItemId(menuItem.id, optionIds)

      const optionsTotal = selectedOptions.reduce((sum, o) => sum + o.priceModifier, 0)
      const unitPrice = menuItem.price + optionsTotal
      const totalPrice = unitPrice * quantity

      store.addItem({
        id,
        menuItem,
        quantity,
        selectedOptions,
        ...(specialInstructions !== undefined ? { specialInstructions } : {}),
        unitPrice,
        totalPrice,
      })
    },
    [store, buildCartItemId]
  )

  const formattedSubtotal = formatPrice(store.getSubtotal())

  return {
    ...store,
    addToCart,
    formattedSubtotal,
    isEmpty: store.items.length === 0,
  }
}
