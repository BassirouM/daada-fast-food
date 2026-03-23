import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MenuItem } from '@/types/menu'

export type CartItem = {
  id: string // unique per item+options combo
  menuItem: MenuItem
  quantity: number
  selectedOptions: Array<{
    groupId: string
    groupName: string
    optionId: string
    optionName: string
    priceModifier: number
  }>
  specialInstructions?: string
  unitPrice: number
  totalPrice: number
}

type CartState = {
  items: CartItem[]
  deliveryAddressId: string | null
  promoCode: string | null
  discount: number

  // Actions
  addItem: (item: CartItem) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  setDeliveryAddress: (addressId: string) => void
  applyPromoCode: (code: string, discount: number) => void
  clearCart: () => void

  // Computed
  getSubtotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryAddressId: null,
      promoCode: null,
      discount: 0,

      addItem: (newItem) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === newItem.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === newItem.id
                  ? {
                      ...i,
                      quantity: i.quantity + newItem.quantity,
                      totalPrice: (i.quantity + newItem.quantity) * i.unitPrice,
                    }
                  : i
              ),
            }
          }
          return { items: [...state.items, newItem] }
        }),

      removeItem: (itemId) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== itemId) })),

      updateQuantity: (itemId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.id !== itemId) }
          }
          return {
            items: state.items.map((i) =>
              i.id === itemId
                ? { ...i, quantity, totalPrice: quantity * i.unitPrice }
                : i
            ),
          }
        }),

      setDeliveryAddress: (addressId) => set({ deliveryAddressId: addressId }),

      applyPromoCode: (code, discount) => set({ promoCode: code, discount }),

      clearCart: () =>
        set({ items: [], deliveryAddressId: null, promoCode: null, discount: 0 }),

      getSubtotal: () => get().items.reduce((acc, item) => acc + item.totalPrice, 0),

      getItemCount: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
    }),
    {
      name: 'daada-cart',
    }
  )
)
